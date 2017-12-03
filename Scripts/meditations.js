var Meditations = Meditations || {};

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

let g_Radiuses = [[0,0,0,0,0], [1200, 2700, 4500], [800, 2500], [650]];
let g_Debug = false;

function CreateSlides(node, center, angleDegParent, depth)
{
    let children = node.children;

    let leafDepthToCountMap = {};

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


        let angleDeg = (realIndex / childCount) * 360 + angleDegParent + phaseShift;
        let angleRad = angleDeg * Math.PI / 180;
        let radius = g_Radiuses[child.depth][numberOfExtraLevels];
        let x = center.x + radius * Math.cos(angleRad);
        let y = center.y + radius * Math.sin(angleRad);

        let childHtml = "";
        if (g_Debug)
        {
            childHtml += `<span>`;
            childHtml += `Parent: '${child.parent.text}'; Depth: ${child.depth} ; Radius: ${radius}; `
            childHtml += `extra-depth: ${numberOfExtraLevels}; phase: ${phaseShift};`
            childHtml += `</span >`;
        }
        childHtml += child.header + child.content;

        $("#impress").append(`<div class='step slide' data-x='${x}' data-y='${y}' data-rotate='${angleDeg}' id='${child.id}'>${childHtml}</div>`);
        CreateSlides(child, { "x": x, "y": y }, angleDeg, depth + 1);
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

    $("#impress").append(`<div id="overview" class="step" data-x="0" data-y="0" data-z="0" data-scale="7"></div>`);

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
            });
    });