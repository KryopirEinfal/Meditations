var Meditations = Meditations || {};

function AllChildren(element, type, depth)
{
    if (element === document || depth === 0)
        return $(element).find(type);
    return $(element).next().find(type);
}

function CreateHierarchyInternal(node, childSelectors, depth)
{
    let children = AllChildren(node.val, childSelectors[depth], 0);
    for (let i = 0; i < children.length; ++i)
    {
        let child = children[i];
        let jChild = $(child);
        let content = jChild.next();
        let childNode = {
            "text": jChild.text(),
            "val": child,
            "width": content.width(),
            "height": content.height(),
            "children": []
        };
        childNode.toString = function () { return childNode.text; }

        node.children.push(childNode);
        CreateHierarchyInternal(childNode, childSelectors, depth + 1);
    }
}

function CreateHierarchy(childSelectors, root)
{
    if (typeof root === "undefined")
        root = document;

    let rootNode = {
        "val": root,
        "children": []
    };
    CreateHierarchyInternal(rootNode, childSelectors, 0);
    return rootNode;
}

function Load()
{
    let documentHierarchy = CreateHierarchy(["h1", "h2", "h3"], $("#byte-content")[0])
        .children;
    Meditations.Hierarchy = documentHierarchy;
    let number = documentHierarchy.length;

    let radius = 1400;
    let child = documentHierarchy[0];

    jChild = $(child.val)
    let childHtml = jChild[0].outerHTML + (jChild.next().html() != undefined ? jChild.next().html() : "")
    $("#impress").append("<div class='step slide' data-x='0' data-y='0'>" + childHtml + "</div>")
    for (let i = 1; i < number; ++i)
    {
        let child = documentHierarchy[i];
        jChild = $(child.val)
        childHtml = jChild[0].outerHTML + (jChild.next().html() != undefined ? jChild.next().html() : "")

        let angleDeg = ((i - 1) / (number - 1)) * 360;
        let angleRad = ((i - 1) / (number - 1)) * 2 * Math.PI;
        let x = radius * Math.cos(angleRad);
        let y = radius * Math.sin(angleRad);

        $("#impress").append(`<div class='step slide' data-x='${x}' data-y='${y}' data-rotate='${angleDeg}' >${childHtml}</div>`);
    }

    $("#impress").append(`<div id="overview" class="step" data-x="0" data-y="0" data-z="0" data-scale="5"></div>`);
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