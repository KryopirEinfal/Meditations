class Node
{

}

function AllChildren(element, type)
{
    if (element === document)
        return $(element).find(type);
    return $(element).next().find(type);
}

function CreateHierarchyInternal(node, childSelectors, depth)
{
    let children = AllChildren(node.val, childSelectors[depth]);
    for (let i = 0; i < children.length; ++i)
    {
        let child = children[i];
        let jChild = $(child);
        let childNode = {
            "text": jChild.text(),
            "val": child,
            "children": []
        };
        childNode.toString = function () { return childNode.text; }

        node.children.push(childNode);
        CreateHierarchyInternal(childNode, childSelectors, depth + 1);
    }
}

function CreateHierarchy(childSelectors)
{
    let root = {
        "val": document,
        "children": []
    };
    CreateHierarchyInternal(root, childSelectors, 0);
    return root;
}

$(document).ready(function () {
    let h1s = $("h1");
    for (let i = 0; i < h1s.length; ++i)
    {
        let h2s = $(h1s[i]).next().find("h2")
    }
});