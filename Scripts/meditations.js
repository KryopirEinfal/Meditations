var Meditations = Meditations || {};
let g_Debug = false;

function AllChildren(element, type, depth)
{
    if (element === document)
        return $(element).find(type);
    return $(element).next().find(type);
}

function CreateNode(child, parent)
{
    let jChild = $(child);
    let node = {
        "text": jChild.text(),
        "header": jChild[0].outerHTML,
        "jVal": jChild,
        "val": child,
        "parent": parent,
        "children": [],
        "id": jChild.find("a").attr("name")
    };
    return node;
}

function CreateHierarchyInternal(node, childSelectors, depth)
{
    let children = AllChildren(node.val, childSelectors[depth], depth);
    let leafsDepth = depth;
    for (let i = 0; i < children.length; ++i)
    {
        let child = children[i];

        let childNode = CreateNode(child, node);
        childNode.toString = function () { return childNode.text; }

        node.children.push(childNode);
        CreateHierarchyInternal(childNode, childSelectors, depth + 1);

        // Removing all children will leave nothing but the actual content 
        // of the current node
        childNode.jVal.next().remove();
        childNode.jVal.remove();
        //calculate final depth;
        if (childNode.leafsDepth > leafsDepth)
            leafsDepth = childNode.leafsDepth;
    }

    node.content = node.jVal.next()[0].outerHTML;
    node.depth = depth;
    node.leafsDepth = leafsDepth;
}

function CreateHierarchy(childSelectors, root)
{
    if (typeof root === "undefined")
        root = document;

    let rootNode = CreateNode(root, null);

    CreateHierarchyInternal(rootNode, childSelectors, 0);
    return rootNode;
}

let g_Radiuses = [[0,0,0,0], [600, 1300, 1500], [400, 700], [200]];

function CreateSlide(node, center, angleDeg, depth)
{
    let numberOfExtraLevels = node.leafsDepth - node.depth;
    // radius from parent
    let radius = g_Radiuses[node.depth][numberOfExtraLevels];
    let scale = Math.pow(0.6, depth);

    let phaseShift = numberOfExtraLevels * node.depth * 45;

    let html = "";
    if (g_Debug) {
        html += `<span>`;
        html += `Parent: '${node.parent.text}'; Depth: ${node.depth} ; Radius: ${radius}; `
        html += `extra-depth: ${numberOfExtraLevels}; phase: ${phaseShift};`
        html += `</span >`;
    }
    //Add overlay
    html += `<div class="med-slide-overlay"><h1>${node.text}</h1></div>\n`;
    //Add actual content
    html += `<div class="med-slice-content">${node.header}\n${node.content}</div>`;

    let debugClass = g_Debug ? "med-debug" : "";

    $("#impress").append(`<div id='${node.id}' class='step slide ${debugClass}' data-x='${center.x}' data-y='${center.y}' data-rotate='${angleDeg}' data-scale='${scale}' >${html}</div>`);

}

function CreateSlides(node, center, angleDeg, depth)
{
    let children = node.children;

    let leafDepthToCountMap = {};
    if (depth != 0) {
        CreateSlide(node, center, angleDeg, depth);
    }

    for (let i = 0; i < children.length; ++i)
    {
        let child = children[i];

        let numberOfChildrenWithLeafDepth = children.filter(v => v.leafsDepth === child.leafsDepth).length;

        //We distribute children differently based on whether they have children or not
        // So instead of using their index (i), we use their index relative to all
        // their siblings with the same leafDepth
        let realIndex = 0;
        if (leafDepthToCountMap[numberOfChildrenWithLeafDepth] === undefined)
            leafDepthToCountMap[numberOfChildrenWithLeafDepth] = 0;
        else
            leafDepthToCountMap[numberOfChildrenWithLeafDepth] += 1;

        realIndex = leafDepthToCountMap[numberOfChildrenWithLeafDepth];

        //Number of children with as many leafDepths
        let childCount = numberOfChildrenWithLeafDepth;

        // So that not all children with different level of children end up 
        // with 0 degrees, we phase shift them 
        // Say 3 children each with [0,1,2] more levels.
        // The would all end up aligned at 0 degrees, and we don't want that
        let numberOfExtraLevels = child.leafsDepth - child.depth;
        let phaseShift = numberOfExtraLevels * child.depth * 45;

        let angleDegChild = (realIndex / childCount) * 360 + angleDeg + phaseShift;
        let angleRad = angleDegChild * Math.PI / 180;
        let radius = g_Radiuses[child.depth][numberOfExtraLevels];
        let x = center.x + radius * Math.cos(angleRad);
        let y = center.y + radius * Math.sin(angleRad);

        CreateSlides(child, { "x": x, "y": y }, angleDegChild, depth + 1);
    }
}

function CreateOutlineInternal(node, depth, res)
{
    res.push(`<div class="med-section-link" goto="${node.id}">${node.text}</div>`);
    if (node.children.length === 0)
        return;
    for (let i = 0; i < node.children.length; ++i)
    {
        res.push(`<div class="med-outline-children med-outline-depth-${depth+1}">`);
        CreateOutlineInternal(node.children[i], depth + 1, res);
        res.push(`</div>`);
    }
}

function CreateOutline(node)
{
    let res = [];
    CreateOutlineInternal(node, 0, res);
    res.push(`<div class="med-section-link med-section-link-overview" goto="overview">Overview</div>`);
    let html = res.join("\n");
    $("#med-outline").html(html);
    $(".med-section-link").click(function (e)
    {
        Meditations.Impress.goto($(e.target).attr("goto"));
    });
}

function Load()
{
    let root = CreateHierarchy(["h1", "h2", "h3"], $(".med-title")[0]);
    Meditations.Hierarchy = root;

    let html = root.header + root.content;
    $("#impress").append(`<div class='step slide' data-x='0' data-y='0' id='${root.id}'>${html}</div>`);
    CreateSlides(root, { "x": 0, "y": 0 }, 0 , 0);

    $("#impress").append(`<div id="overview" class="step" data-x="0" data-y="0" data-z="0" data-scale="3"></div>`);

    CreateOutline(root);

    $("#impress a").attr("target", "_new");
}

$(document).ready(
    function ()
    {
        $("#byte-content").load(
            "FreeWill/FreeWill.html #all-content",
            function ()
            {
                Load();
                Meditations.Impress = impress();
                Meditations.Impress.init();
                if (Meditations.IsMobile) {
                    Meditations.Impress.getConfig().width = 420;
                    Meditations.Impress.getConfig().height = 720;
                }
                else {
                    Meditations.Impress.getConfig().width = 600;
                    Meditations.Impress.getConfig().height = 600;
                }
            });

        Meditations.IsMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
        if (Meditations.IsMobile)
        {
            $("body").addClass("med-mobile");
        }
    });