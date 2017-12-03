var Meditations = Meditations || {};

function AllChildren(element, type, depth)
{
    if (element === document || depth === 0)
        return $(element).find(type);
    return $(element).next().find(type);
}

function CreateHierarchyInternal(node, childSelectors, depth)
{
    let children = AllChildren(node.val, childSelectors[depth], depth);
    let leafsDepth = depth;
    for (let i = 0; i < children.length; ++i)
    {
        let child = children[i];
        let jChild = $(child);
        let childNode = {
            "text": jChild.text(),
            "header": jChild[0].outerHTML,
            "jVal": jChild,
            "val": child,
            "parent": node,
            "children": []
        };
        childNode.toString = function () { return childNode.text; }

        node.children.push(childNode);
        CreateHierarchyInternal(childNode, childSelectors, depth + 1);

        // Removing all children will leave nothing but the actual content 
        // of the current node
        jChild.next().remove();
        jChild.remove();
        //calculate final depth;
        if (childNode.leafsDepth > leafsDepth)
            leafsDepth = childNode.leafsDepth;
    }

    if(depth !== 0)
        node.content = node.jVal.next()[0].outerHTML;
    node.depth = depth;
    node.leafsDepth = leafsDepth;
}

function CreateHierarchy(childSelectors, root)
{
    if (typeof root === "undefined")
        root = document;

    let rootNode = {
        "text": "I AM ROOT",
        "val": root,
        "jVal": $(root),
        "children": []
    };
    CreateHierarchyInternal(rootNode, childSelectors, 0);
    return rootNode;
}

let g_Radiuses = [[], [], [1500, 3000, 4500], [750, 2000], [750]];
let g_Debug = true;

function CreateSlides(node, center, angleDegParent, depth)
{
    let chilren = node.children;
    for (let i = 0; i < chilren.length; ++i)
    {
        let child = chilren[i];

        let angleDeg = (i / chilren.length) * 360 + angleDegParent;
        let angleRad = angleDeg * Math.PI / 180;
        let radius = g_Radiuses[child.depth][child.leafsDepth - child.depth];
        let x = center.x + radius * Math.cos(angleRad);
        let y = center.y + radius * Math.sin(angleRad);

        let childHtml = g_Debug ? `<span>Radius ${radius} from parent '${child.parent.text}'</span>` : ""
        childHtml += child.header + child.content;

        $("#impress").append(`<div class='step slide' data-x='${x}' data-y='${y}' data-rotate='${angleDeg}' >${childHtml}</div>`);
        CreateSlides(child, { "x": x, "y": y }, angleDeg, depth + 1);
    }
}

function Load()
{
    let documentHierarchy = CreateHierarchy([".med-title", "h1", "h2", "h3"], $("#byte-content")[0])
        .children;
    Meditations.Hierarchy = documentHierarchy;
    let number = documentHierarchy.length;

    let radius = 6000;
    let root = documentHierarchy[0];
    let html = root.header + root.content;
    $("#impress").append(`<div class='step slide' data-x='0' data-y='0'>${html}</div>`);
    CreateSlides(root, { "x": 0, "y": 0 }, 0 , 0);

    $("#impress").append(`<div id="overview" class="step" data-x="0" data-y="0" data-z="0" data-scale="15"></div>`);
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
                impress().init();
            });
    });