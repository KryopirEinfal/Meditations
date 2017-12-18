var Meditations = Meditations || {};
let g_Debug = false;
Meditations.Scaling = 0.5;
Meditations.SlideHeight = 600;
Meditations.SlideWidth = 600;

$(document).ready(
    function () {
        $("#byte-content").load(
            "FreeWill/FreeWill.html #all-content",
            function () {
                Load();
                Meditations.Impress = impress();
                Meditations.Impress.init();
                if (Meditations.IsMobile) {
                    Meditations.Impress.getConfig().width = 420;
                    Meditations.Impress.getConfig().height = 720;
                }
                else {
                    Meditations.Impress.getConfig().width = Meditations.SlideWidth;
                    Meditations.Impress.getConfig().height = Meditations.SlideHeight;
                }
            });

        Meditations.IsMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
        if (Meditations.IsMobile) {
            $("body").addClass("med-mobile");
        }

        $(document).keydown(function (e) {
            console.log(e.char);
            console.log(e.keyCode);
            switch (e.char) {
                case "w":

            }
        });
    });

function Load() {
    let root = CreateHierarchy(["h1", "h2", "h3"], $(".med-title")[0]);
    Meditations.Hierarchy = root;

    CreateSlides(root, { "x": 0, "y": 0 }, 0, 0);

    $("#impress").append(`<div id="overview" class="step" data-x="0" data-y="0" data-z="0" data-scale="3"></div>`);

    CreateOutline(root);

    $("#impress a").attr("target", "_new");
}


function AllChildren(element, type, depth)
{
    if (element === document)
        return $(element).find(type);
    return $(element).next().find(type);
}

function CreateNode(child, parent)
{
    let jChild = $(child);
    let next = jChild.next();
    let node = {
        "text": jChild.text(),
        "header": jChild[0].outerHTML,
        "jVal": jChild,
        "val": child,
        "parent": parent,
        "children": [],
        "img": next.attr("med-img") || null,
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

function CreateSlide(node, center, angleDeg, depth, numberOfSiblings)
{
    let numberOfExtraDepth = node.leafsDepth - node.depth;
    // radius from parent
    let radius = CalculateRadius(depth - 1, numberOfSiblings, numberOfExtraDepth);
    let scale = Math.pow(Meditations.Scaling, depth);
    let phaseShift = numberOfExtraDepth * node.depth * 45;

    let html = "";
    if (g_Debug) {
        let parentText = node.parent !== null ? node.parent.text : "I ARE ROOT";
        html += `<span>`;
        html += `Parent: '${parentText}'; Depth: ${node.depth} ; Radius: ${radius}; `
        html += `extra-depth: ${numberOfExtraDepth}; phase: ${phaseShift};`
        html += `</span >`;
    }
    let addImg = node.img !== null;
    //Add overlay
    html += `<div id="med-slide-overlay-${node.id}" class="med-slide-overlay">`
        + `<h1 class="center-horizontal">${node.text}</h1>`
        + (addImg ? `<img src="${node.img}" class="center-horizontal"/>` : "")
        + `</div>\n`;
    //Add actual content
    html += `<div class="med-slice-content container-fluid">${node.header}\n${node.content}</div>`;

    let debugClass = g_Debug ? "med-debug" : "";

    $("#impress").append(`<div id='${node.id}' class='step slide ${debugClass}' data-x='${center.x}' data-y='${center.y}' data-rotate='${angleDeg}' data-scale='${scale}' >${html}</div>`);

    if (addImg)
        FixOverlayImageSize(node.id);
}

function CreateSlides(node, center, angleDeg, depth, numberOfSiblings)
{
    CreateSlide(node, center, angleDeg, depth, numberOfSiblings);

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
        let numberOfExtraDepth = child.leafsDepth - child.depth;
        let phaseShift = numberOfExtraDepth * child.depth * 45;

        let angleDegChild = (realIndex / childCount) * 360 + angleDeg + phaseShift;
        let angleRad = angleDegChild * Math.PI / 180;

        let radius = CalculateRadius(depth, childCount, numberOfExtraDepth);

        let x = center.x + radius * Math.cos(angleRad);
        let y = center.y + radius * Math.sin(angleRad);

        CreateSlides(child, { "x": x, "y": y }, angleDegChild, depth + 1, childCount);
    }
}

function CreateOutline(node) {
    let res = [];
    CreateOutlineInternal(node, 0, res);
    res.push(`<div class="med-section-link med-section-link-overview" goto="overview">Overview</div>`);
    let html = res.join("\n");
    $("#med-outline").html(html);
    $(".med-section-link").click(function (e) {
        Meditations.Impress.goto($(e.target).attr("goto"));
    });
}

function CreateOutlineInternal(node, depth, res) {
    res.push(`<div class="med-section-link" goto="${node.id}">${node.text}</div>`);
    if (node.children.length === 0)
        return;
    res.push(`<div class="med-outline-children med-outline-depth-${depth + 1}">`);
    for (let i = 0; i < node.children.length; ++i) {
        CreateOutlineInternal(node.children[i], depth + 1, res);
    }
    res.push(`</div>`);
}


function FixOverlayImageSize(nodeId) {
    let img = $(`#med-slide-overlay-${nodeId} img`);
    let imgWidth = img.width();
    let imgHeight = img.height();
    let avWidth = Meditations.SlideWidth;
    let avHeight = Meditations.SlideHeight - $(`#med-slide-overlay-${nodeId} h1`).height();

    let avRatio = avHeight / avWidth;
    let imgRatio = imgHeight / imgWidth;

    if (imgRatio > avRatio) {
        img.height(avHeight);
    }
    else {
        img.width(avWidth);
    }
}


function CalculateRadius(parentDepth, childCount, childExtraDepth) {
    let g_Radiuses = [[0, 0, 0, 0], ['x', 1100, 1300], ['x', 700], ['x']];
    let radius = g_Radiuses[parentDepth + 1][childExtraDepth];
    /*
    Theoretical radius for a n-sided regular polygon with lenght side L
     Internal angles are: a = 360/n
     angles of the triangles that make up the sides is thus (180 - 360/n)/2 = 90 - 180/n
     Lets call that t = 90 - 180/n
          /a\
         / | \
        /  |  \
       /   |   \
      /____|__t_\

      So tan(t) = r/(L/2) => r = L/2 tan(t)
      r = L/2 tan(90 - 180/n)
      or r = L/2 (tan(pi/2 * (n-2)/n))
    */
    let scale = Math.pow(Meditations.Scaling, parentDepth + 1);
    let h = scale * Meditations.SlideHeight;
    let w = scale * Meditations.SlideWidth;
    // The height is our L
    // the position is actually at the center of the slide
    // so we translate by w/2
    if (childExtraDepth === 0)
        radius = h / 2 * Math.tan(Math.PI / 2 * (1 - 2 / childCount)) + w / 2;
    //Can't let radius be any less than the parent's own size 
    // otherwise we overlap
    let parentW = w / Meditations.Scaling;
    let parentH = h / Meditations.Scaling;
    //Furthest point
    let parentSize = Math.sqrt((parentW * parentW + parentH * parentH) / 4);
    if (radius < parentSize + w / 2)
        radius = parentSize + w / 2;

    //add just a little ovelap 
    radius = radius * 0.95;

    radius = Math.round(radius * 100) / 100;
    return radius;
}

