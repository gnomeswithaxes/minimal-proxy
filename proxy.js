var elem = document.getElementById('draw-shapes');
const drawMul = 8;
const showMul = 3.8 + 2.2;
const pageW = 210;
const pageH = 297;
const cardsPerPage = 10;
const W = 63; // card width
const H = 84; // card heigth
const C1 = 2, R1 = 3; // vertical cards (on the left)
const C2 = 1, R2 = 4; // horizontal cards (on the right)
const borderRadius = 3;
const borderOffset = 2; // distance from the border
const dashSize = [2, 2];

const borderW = (W - borderOffset * 2);
const borderH = (H - borderOffset * 2)
const textstartX = borderOffset * 2;
const textstartY = borderOffset * 2;
const textWidth = W - borderOffset * 4;
const verticalTextWidth = (H / 2) - borderOffset * 4
const lineStart = W - 2 * borderOffset;
const elemDistance = borderOffset / 2; // = 1
const textSize = 3.9 //+ 0.2;
const oracleSize = 3.2 //+ 0.3;
const powtouSize = 6;
const maxImageScale = 0.8
const minImageScale = 0.2
const scaleDecrement = 0.05
const powTouTextDistance = 3 * elemDistance

$(async () => {
    await fetch(
        "https://api.scryfall.com/catalog/card-names"
    ).then(async (value) => {
        if (value.ok) {
            response = await value.json();
            $("#cards").autocomplete("option", "source", response.data)
            card_names = response.data
        } else {
            $("#cards-div").css("display", "none")
        }
    });
});

$(() => {
    $("#cards").autocomplete({
        minLength: 3
    });

    $("#add-button").on("click", () => {
        inp = $("#cards")
        if (inp.val() !== "") {
            area = document.getElementById("area")
            area.value += (area.value.slice(-1) == "\n" || area.value.length == 0 ? "" : "\n") + $("#amount").val() + " " + inp.val() + "\n"
            inp.val("")
        }
    })

    $("#update-button").on("click", async () => {
        elem.replaceChildren(...[]); // reset canvas
        $('#progress').css('width', "0%").attr('aria-valuenow', 0); // reset progress bar
        $('#progress').removeClass("bg-success")
        $('#download-button').attr('disabled', true); // disable download button

        const raw = document.getElementById("area").value.trim();
        const lines = raw.match(/[^\r\n]+/g);

        let entries = [] // list of the names of the asked cards
        let to_fetch = [] // list of the individual cards to fetch
        for (let l = 0; l < lines.length; l++) {
            let amount = 1
            let entry = ""
            let parts = lines[l].trim().split(" ")
            if (parts.length <= 1 || isNaN(parts[0])) {
                entry = lines[l]
            } else {
                amount = parts[0]
                entry = parts.slice(1).join(" ")
            }
            to_fetch.push(entry.split("//")[0]);
            // a number of duplicate entries equal to the asked amount is added
            entries.push(...Array.from({ length: amount }, () => (entry)));
        }

        let card_list = [] // card objects retrieved from scryfall
        while (to_fetch.length) {
            await fetch_collection(to_fetch.splice(0, 75).map((n) => { return { name: n } }))
                .then((response) => card_list = [...card_list, ...response.data])
        }

        let skipped = [] // cards not found
        let to_print = [] // the actual cards that will form the pages
        for (const entry of entries) {
            found = card_list.find((card) => card.name.toLocaleLowerCase() == entry.toLocaleLowerCase());
            if (found) {
                if (!found.type_line.includes("Basic")) {
                    if (found.layout != "split" && found.card_faces && found.card_faces.length > 0) {
                        to_print.push(found.card_faces[0])
                        to_print.push(found.card_faces[1])
                    } else {
                        to_print.push(found)
                    }
                }
            } else {
                if (skipped.indexOf(entry) === -1) { // if not already in skipped list
                    skipped.push(entry);
                }
            }
        }

        // show names of skipped cards
        if (skipped.length > 0) {
            $('#skipped').text("Skipped:" + skipped.map((e) => " " + e.name))
        }

        // progress bar
        const max = to_print.length;
        let processed = 0;

        function updateBar() {
            processed += 1;
            let progress = (processed / max * 100);
            $('#progress').css('width', progress + "%").attr('aria-valuenow', progress);
            if (progress == 100) {
                $('#progress').addClass("bg-success")
            }
        }

        // disclaimer
        if (max > 0) {
            $('#anteprima').html("Anteprima di stampa (<i>qualità inferiore rispetto al pdf</i>)");
        }

        // creazione pagine
        images = [];
        let pageId = 0;
        while (to_print.length) {
            const newPage = document.createElement("div");
            newPage.id = 'page-' + pageId
            elem.appendChild(newPage);

            let layer = new Konva.Layer();
            let pageGroup = new Konva.Group();

            // sfondo bianco pagina
            pageGroup.add(
                new Konva.Rect({
                    width: pageW,
                    height: pageH,
                    fill: "white",
                })
            );

            let cards = to_print.splice(0, cardsPerPage);
            let n = 0;

            // vertical cards
            for (let y = 0; y < R1; y++) {
                for (let x = 0; x < C1; x++) {
                    if (n < cards.length) {
                        if (cards[n].layout == "split") {
                            pageGroup.add(await drawSplitCard(new Konva.Group({ x: W * x, y: H * y }), cards[n]));
                        } else {
                            pageGroup.add(await drawCard(new Konva.Group({ x: W * x, y: H * y }), cards[n]));
                        }
                        pageGroup.add(
                            new Konva.Line({
                                points: [W * (x + 1), H * y, W * (x + 1), H * (y + 1), W * (x), H * (y + 1), W * (x + 1), H * (y + 1)],
                                stroke: 'black', strokeWidth: 0.1, dash: dashSize,
                            }));
                        n++;
                        updateBar()
                    }
                }
            }

            // horizontal cards
            for (let i = 0; i < C2; i++) {
                for (let j = 0; j < R2; j++) {
                    if (n < cards.length) {
                        if (cards[n].layout == "split") {
                            pageGroup.add(await drawSplitCard(new Konva.Group({ x: (C1 * W) + (H * i), y: W * (j + 1), rotation: 270 }), cards[n]));
                        } else {
                            pageGroup.add(await drawCard(new Konva.Group({ x: (C1 * W) + (H * i), y: W * (j + 1), rotation: 270 }), cards[n]));
                        }
                        pageGroup.add(
                            new Konva.Line({
                                points: [(C1 * W) + (H * i), W * (j + 1), (C1 * W) + (H * (i + 1)), W * (j + 1)],
                                stroke: 'black', strokeWidth: 0.1, dash: dashSize,
                            }));
                        // a line is missing, but it isn't shown in the current configuration anyway
                        n++;
                        updateBar()
                    }
                }
            }

            // A4 page border
            pageGroup.add(new Konva.Rect({ width: pageW, height: pageH, stroke: "white", strokeWidth: 0.5, })
            );

            // the image is saved at a higher resolution...
            let stage = new Konva.Stage({
                container: newPage.id,
                width: pageW * drawMul,
                height: pageH * drawMul,
            })
            pageGroup.scale({ x: drawMul, y: drawMul });
            layer.add(pageGroup);
            stage.add(layer);
            images.push(stage.toDataURL({ pixelRatio: 1 }));

            // ...but it's then shown with the right dimensions
            stage.height(pageH * showMul);
            stage.width(pageW * showMul);
            pageGroup.scale({ x: showMul, y: showMul });

            // draw the page on screen
            layer.draw();
            pageId++;
        }

        if (max > 0) {
            $('#download-button').on('click', (event) => {
                if (!event.detail || event.detail == 1) { // prevents multiple clicks
                    $('#download-button').attr('disabled', true);
                    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4', true);

                    for (const [i, image] of images.entries()) {
                        pdf.addImage(image, 0, 0, pageW, pageH);
                        if (i !== images.length - 1)
                            pdf.insertPage();
                    }
                    const fileName = ($("#download-name").val() || "proxy") + ".pdf"
                    pdf.save(fileName, { returnPromise: true })
                        .then(() => $('#download-button').removeAttr('disabled'))
                }
            });
            $('#download-button').removeAttr('disabled')
        };
    });
});

async function fetch_collection(ids) {
    return fetch("https://api.scryfall.com/cards/collection", {
        method: "POST", headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: ids })
    }).then(async r => {
        return await r.json();
    })
}

async function drawCard(cardGroup, card) {
    // card outer border 
    let border = new Konva.Rect({
        x: borderOffset,
        y: borderOffset,
        width: borderW,
        height: borderH,
        stroke: "gray",
        strokeWidth: 0.5,
        fill: null,
        cornerRadius: borderRadius
    })

    // adds the appropriate gradient if the card is not colorless
    if ((card.colors && card.colors.length > 0)
        || (card.color_identity && card.color_identity.length > 0)) {
        border.strokeLinearGradientStartPoint({ x: W / 2, y: borderOffset });
        border.strokeLinearGradientEndPoint({ x: W / 2, y: H - borderOffset });
        if (card.colors && card.colors.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.colors));
        } else if (card.color_identity && card.color_identity.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.color_identity));
        }
    }
    cardGroup.add(border);

    // card name
    let nameText = new Konva.Text({
        x: textstartX,
        y: textstartY,
        width: textWidth,
        text: card.name,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: 'center',
        fill: 'black',
    })
    cardGroup.add(nameText);

    // separator between name and type
    let sep1 = new Konva.Line({
        points: [lineStart, nameText.y() + nameText.height() + elemDistance, W - lineStart, nameText.y() + nameText.height() + elemDistance],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep1)

    // card type
    let typeText = new Konva.Text({
        x: textstartX,
        y: sep1.points()[1] + 2 * elemDistance,
        text: card.type_line,//.replace('—', '\n').trim(),
        width: textWidth,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: "center",
        fill: 'black',
    })
    cardGroup.add(typeText);

    // separator between type and art/text
    let sep2 = new Konva.Line({
        points: [lineStart, typeText.y() + typeText.height() + elemDistance, W - lineStart, typeText.y() + typeText.height() + elemDistance],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep2)

    // lower bound for text
    let textStop = H - 2 * borderOffset

    // add power/toughness, loyalty, cost (if present)
    if ((card.power && card.power.length > 0) || (card.toughness && card.toughness.length > 0)
        || (card.mana_cost && card.mana_cost.length > 0) || card.loyalty && card.loyalty.length > 0) {

        bottomRightText = "";
        if (card.power) {
            bottomRightText = card.power.trim() + "/" + card.toughness.trim();
        } else if (card.loyalty) {
            bottomRightText = " " + card.loyalty + " ";
        }

        // temp element to compute size
        const temp = new Konva.Text({ text: bottomRightText, fontSize: powtouSize, fontFamily: "Roboto Condensed", })
        temp.y(H - temp.height() - 2 * borderOffset);

        // mana cost
        if (card.mana_cost && card.mana_cost.length > 0) {
            costGroup = newCostGroup(card.mana_cost);
            costGroup.x(textstartX + borderOffset);
            costGroup.y(temp.y() + powTouTextDistance);
            cardGroup.add(costGroup);
        }

        // separator between lower elements and card text
        let sep3 = new Konva.Line({
            points: [lineStart, temp.y() - borderOffset, W - lineStart, temp.y() - borderOffset],
            stroke: "black",
            strokeWidth: 0.1
        })
        cardGroup.add(sep3);

        // real element for bottom right text
        if (bottomRightText.length > 0) {
            powtouText = new Konva.Text({
                x: textstartX,
                y: sep3.points()[1] + sep3.strokeWidth() + (H - borderOffset - sep3.points()[1] - temp.height()) / 2,
                text: bottomRightText,
                fontSize: powtouSize,
                fontFamily: "Roboto Condensed",
                width: textWidth,
                align: 'right',
                fill: 'black',
            })
            cardGroup.add(powtouText);

            // vertical separator between cost and bottom right text
            let sep4 = new Konva.Line({
                points: [W - temp.width() - 2 * borderOffset - elemDistance, temp.y() - borderOffset,
                W - temp.width() - 2 * borderOffset - elemDistance, H - borderOffset - elemDistance],
                stroke: "black",
                strokeWidth: 0.1
            })
            cardGroup.add(sep4);
        }

        // text now has to stop before the new elements
        textStop = sep3.points()[1] - borderOffset;
    }

    // card oracle text
    let oracle_text = card.oracle_text.replace(/ *\([^)]*\) */g, "")
    let cardText = new Konva.Text({
        x: textstartX,
        text: oracle_text.replace(/\{[^\{]+\}/g, s => symbol_dic[s]),
        fontSize: oracleSize,
        fontFamily: "Open Sans",
        align: "left",
        width: textWidth,
        lineHeight: 1.1,
        fill: 'black',
    })
    cardText.y(textStop - cardText.height())
    cardGroup.add(cardText);

    // Add card art if there is available space
    let remaining_space = cardText.y() - sep2.points()[1] - 2 * elemDistance
    if (remaining_space > 0) {
        const imgLoadPromise = new Promise(resolve => {
            var imageObj = new Image();
            imageObj.onload = () => {
                var img = new Konva.Image({ image: imageObj });

                // until it doesn't fit, scale it down 0.1
                currentScale = maxImageScale
                while (img.height() > remaining_space && currentScale >= minImageScale) {
                    img.width(textWidth * currentScale)
                    img.height(imageObj.height * (textWidth / imageObj.width) * currentScale)
                    currentScale = currentScale - scaleDecrement
                }

                // center the art then move the text (and a separator) underneath it
                if (img.height() <= remaining_space) {
                    img.x((W - img.width()) / 2)
                    img.y(sep2.points()[1] + elemDistance)
                    let sep5 = new Konva.Line({
                        points: [lineStart, img.y() + img.height() + elemDistance, W - lineStart, img.y() + img.height() + elemDistance],
                        stroke: "black", strokeWidth: 0.1
                    })
                    cardText.y(sep5.points()[1] + 2 * elemDistance)
                    cardGroup.add(img);
                    cardGroup.add(sep5);
                }
                resolve();
            };
            imageObj.setAttribute('crossOrigin', 'anonymous');
            imageObj.src = card.image_uris.art_crop;
        })
        // wait for the image to load before returning the cardGroup, so it's actually saved in the pdf
        await imgLoadPromise;
    }

    return cardGroup;
}

async function drawSplitCard(cardGroup, card) {
    const leftFace = card.card_faces[0]
    const rightFace = card.card_faces[1]

    // card outer border 
    let border = new Konva.Rect({
        x: borderOffset,
        y: borderOffset,
        width: borderW,
        height: borderH,
        stroke: "gray",
        strokeWidth: 0.5,
        fill: null,
        cornerRadius: borderRadius
    })

    // adds the appropriate gradient if the card is not colorless
    if ((card.colors && card.colors.length > 0)
        || (card.color_identity && card.color_identity.length > 0)) {
        border.strokeLinearGradientStartPoint({ x: borderOffset, y: H / 2 });
        border.strokeLinearGradientEndPoint({ x: W - borderOffset, y: H / 2 });
        if (card.colors && card.colors.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.colors));
        } else if (card.color_identity && card.color_identity.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.color_identity));
        }
    }
    cardGroup.add(border);

    // separator between faces
    let sep = new Konva.Line({
        points: [textstartX, H / 2, W - textstartX, H / 2],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep)

    // card names
    let leftNameText = new Konva.Text({
        x: textstartX,
        y: H - textstartY,
        width: (H - textstartY) / 2,
        text: leftFace.name,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: 'center',
        fill: 'black',
        rotation: 270
    })
    cardGroup.add(leftNameText);

    let rightNameText = new Konva.Text({
        x: leftNameText.x(),
        y: H / 2,
        width: leftNameText.width(),
        text: rightFace.name,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: 'center',
        fill: 'black',
        rotation: 270
    })
    cardGroup.add(rightNameText);

    // separator between names and types
    let sep1 = new Konva.Line({
        points: [leftNameText.x() + leftNameText.height() + elemDistance, leftNameText.y(),
        leftNameText.x() + leftNameText.height() + elemDistance, textstartY],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep1)

    // card types
    let leftTypeText = new Konva.Text({
        x: sep1.points()[0] + 2 * elemDistance,
        y: H - textstartY,
        width: (H - textstartY) / 2,
        text: leftFace.type_line,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: 'center',
        fill: 'black',
        rotation: 270
    })
    cardGroup.add(leftTypeText);

    let rightTypeText = new Konva.Text({
        x: leftTypeText.x(),
        y: H / 2,
        width: leftNameText.width(),
        text: rightFace.type_line,
        fontSize: textSize,
        fontFamily: "Roboto Condensed",
        align: 'center',
        fill: 'black',
        rotation: 270
    })
    cardGroup.add(rightTypeText);

    // separator between types and art/text
    let sep2 = new Konva.Line({
        points: [leftTypeText.x() + leftTypeText.height() + elemDistance, leftTypeText.y(),
        leftTypeText.x() + leftTypeText.height() + elemDistance, textstartY],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep2)

    // lower bound for text
    let textStop = W - 2 * borderOffset

    // add cost (if present)
    if (leftFace.mana_cost && leftFace.mana_cost.length > 0) {

        bottomRightText = "";

        // temp element to compute size
        const temp = new Konva.Text({ text: bottomRightText, fontSize: powtouSize, fontFamily: "Roboto Condensed", rotation: 270 })
        temp.x(W - temp.height() - 2 * borderOffset);

        // mana cost
        if (leftFace.mana_cost && leftFace.mana_cost.length > 0) {
            costGroup = newCostGroup(leftFace.mana_cost);
            costGroup.rotation(270)
            costGroup.x(temp.x() + powTouTextDistance);
            costGroup.y(leftNameText.y() - borderOffset);
            cardGroup.add(costGroup);
        }

        // separator between lower elements and card text
        let sep3 = new Konva.Line({
            points: [temp.x() - borderOffset, leftNameText.y(), temp.x() - borderOffset, textstartY],
            stroke: "black",
            strokeWidth: 0.1
        })
        cardGroup.add(sep3);

        // text now has to stop before the new elements
        textStop = sep3.points()[0] - borderOffset;
    }
    if (leftFace.mana_cost && leftFace.mana_cost.length > 0) {

        bottomRightText = "";

        // temp element to compute size
        const temp = new Konva.Text({ text: bottomRightText, fontSize: powtouSize, fontFamily: "Roboto Condensed", rotation: 270 })
        temp.x(W - temp.height() - 2 * borderOffset);

        // mana cost
        if (rightFace.mana_cost && rightFace.mana_cost.length > 0) {
            costGroup = newCostGroup(rightFace.mana_cost);
            costGroup.rotation(270)
            costGroup.x(temp.x() + powTouTextDistance);
            costGroup.y(rightNameText.y() - 2 * borderOffset);
            cardGroup.add(costGroup);
        }
    }

    // card oracle text
    let left_oracle_text = leftFace.oracle_text.replace(/ *\([^)]*\) */g, "")
    let leftCardText = new Konva.Text({
        x: sep2.points()[0] + elemDistance,
        y: leftNameText.y(),
        text: left_oracle_text.replace(/\{[^\{]+\}/g, s => symbol_dic[s]),
        fontSize: oracleSize,
        fontFamily: "Open Sans",
        align: "left",
        width: verticalTextWidth,
        lineHeight: 1.1,
        fill: 'black',
        rotation: 270
    })
    leftCardText.x(textStop - leftCardText.height())
    cardGroup.add(leftCardText);

    let right_oracle_text = rightFace.oracle_text.replace(/ *\([^)]*\) */g, "")
    let rightCardText = new Konva.Text({
        y: rightNameText.y() - borderOffset,
        text: right_oracle_text.replace(/\{[^\{]+\}/g, s => symbol_dic[s]),
        fontSize: oracleSize,
        fontFamily: "Open Sans",
        align: "left",
        width: verticalTextWidth,
        lineHeight: 1.1,
        fill: 'black',
        rotation: 270
    })
    rightCardText.x(textStop - rightCardText.height())
    cardGroup.add(rightCardText);

    const tallest = leftCardText.height() >= rightCardText.height() ? leftCardText : rightCardText

    // Add card art if there is available space
    let remaining_space = tallest.x() - sep2.points()[0] - 2 * elemDistance
    if (remaining_space > 0) {
        const imgLoadPromise = new Promise(resolve => {
            var imageObj = new Image();
            imageObj.onload = () => {
                var leftImg = new Konva.Image({ image: imageObj, rotation: 270 });
                var rightImg = new Konva.Image({ image: imageObj, rotation: 270 });

                leftImg.crop({ x: 0, y: 0, width: leftImg.width() / 2, height: leftImg.height() })
                leftImg.width(leftImg.width() / 2)
                rightImg.crop({ x: rightImg.width() / 2, y: 0, width: rightImg.width() / 2, height: rightImg.height() })
                rightImg.width(rightImg.width() / 2)

                // until it doesn't fit, scale it down 0.1
                currentScale = maxImageScale
                while (leftImg.height() > remaining_space && currentScale >= minImageScale) {
                    leftImg.width(textWidth * currentScale / 2)
                    leftImg.height(imageObj.height * (textWidth / imageObj.width) * currentScale)
                    rightImg.width(textWidth * currentScale / 2)
                    rightImg.height(imageObj.height * (textWidth / imageObj.width) * currentScale)
                    currentScale = currentScale - scaleDecrement
                } 

                // center the art then move the text (and a separator) underneath it
                if (leftImg.height() <= remaining_space) {
                    leftImg.y(leftNameText.y() - ((leftNameText.y() - H / 2) - leftImg.width()) / 2)
                    leftImg.x(sep2.points()[0] + elemDistance)
                    rightImg.y((H/2) - (rightNameText.width() - rightImg.width()) / 2)
                    rightImg.x(leftImg.x())

                    let sep5 = new Konva.Line({
                        points: [leftImg.x() + leftImg.height() + elemDistance, leftNameText.y(), leftImg.x() + leftImg.height() + elemDistance, textstartY],
                        stroke: "black", strokeWidth: 0.1
                    })
                    leftCardText.x(sep5.points()[0] + 2 * elemDistance)
                    rightCardText.x(sep5.points()[0] + 2 * elemDistance)
                    cardGroup.add(leftImg);
                    cardGroup.add(rightImg);
                    cardGroup.add(sep5);
                }
                resolve();
            };
            imageObj.setAttribute('crossOrigin', 'anonymous');
            imageObj.src = card.image_uris.art_crop;
        })
        // wait for the image to load before returning the cardGroup, so it's actually saved in the pdf
        await imgLoadPromise;
    }

    return cardGroup;
}

function getGradient(identity) {
    colors = colorsArrayFromIdentity(identity, 50);
    let stops = []
    for (let n = 0; n < colors.length; n++) {
        offset = n * (colors.length == 1 ? 1 : (1.0 / (colors.length - 1)));
        stops.push(offset, colors[n]);
    }
    return stops;
}

function colorsArrayFromIdentity(identity, times = 1) {
    let colors = []
    for (i of identity) colors.push(...new Array(times).fill(colorFromIdentity(i)));
    return colors;
}

function colorFromIdentity(identity) {
    if (identity.includes("W")) return "gold";
    if (identity.includes("U")) return "blue";
    if (identity.includes("B")) return "black";
    if (identity.includes("R")) return "red";
    if (identity.includes("G")) return "green";
    if (identity.includes("C")) return "gray";
}

function newCostGroup(cost) {
    let distance = 3;
    let Hsize = 2;
    let size = 1.75;

    symbols = cost.split("}{").map((e) => { return e.replace("{", "").replace("}", "").trim() });

    if (symbols.length >= 7) { size = 1.5; distance = 2.5; Hsize = 1.4 }

    group = new Konva.Group();
    for (let i = 0; i < symbols.length; i++) {
        symbol = symbols[i];
        if ("WUBRGC".includes(symbol)) {
            group.add(new Konva.Circle({
                x: i * (Hsize + distance),
                radius: size,
                stroke: colorFromIdentity(symbol),
                strokeWidth: 0.75,
            }))
        }
        else if (symbol.includes("/")) {
            let parts = symbol.split("/");
            const index = parts.indexOf("P");
            if (index > -1) {
                parts.splice(index, 1);
            }
            group.add(new Konva.Circle({
                x: i * (Hsize + distance),
                radius: (index > -1 ? size : Hsize),
                fillLinearGradientStartPoint: { x: 0, y: -Hsize },
                fillLinearGradientEndPoint: { x: 0, y: Hsize },
                fillLinearGradientColorStops: getGradient(parts),
                stroke: (index > -1 ? "black" : null),
                strokeWidth: 0.75,
            }));
        } else {
            group.add(new Konva.Text({
                x: i * (distance + Hsize) - 1,
                y: -Hsize,
                text: symbol,
                fontSize: 5,
                fontStyle: "bold",
            }))
        }
    }

    return group;
}

// TODO: Carte con due facce (tipo fire//ice) e quelle stronze di kamigawa 
// TODO: Cambiare orientamento gradiente bordi
// TODO: aggiungere nome artista (magari in bianco in parte inferiore art)
// TODO: utente può cambiare parametri
// TODO: Possibilità cambiare art mostrata
// TODO: Indentazione abilità planeswalker e spazio tra paragrafi
// TODO: Possibilità rescaling manuale testo

var symbol_dic = {
    "{T}": "\ue61a",
    "{Q}": "\ue16b",
    "{E}": "\ue907",
    "{PW}": "\ue623",
    "{CHAOS}": "\ue61d",
    "{A}": "\ue929",
    "{TK}": "\ue965",
    "{X}": "\ue615",
    "{Y}": "\ue616",
    "{Z}": "\ue617",
    "{0}": "\ue605",
    "{½}": "\ue902",
    "{1}": "\ue606",
    "{2}": "\ue607",
    "{3}": "\ue608",
    "{4}": "\ue609",
    "{5}": "\ue60a",
    "{6}": "\ue60b",
    "{7}": "\ue60c",
    "{8}": "\ue60d",
    "{9}": "\ue60e",
    "{10}": "\ue60f",
    "{11}": "\ue610",
    "{12}": "\ue611",
    "{13}": "\ue612",
    "{14}": "\ue613",
    "{15}": "\ue614",
    "{16}": "\ue62a",
    "{17}": "\ue62b",
    "{18}": "\ue62c",
    "{19}": "\ue62d",
    "{20}": "\ue62e",
    "{100}": "\ue900",
    "{1000000}": "\ue901",
    "{∞}": "\ue903",
    "{W/U}": "\ue600/\ue601",
    "{W/B}": "\ue600/\ue602",
    "{B/R}": "\ue602/\ue603",
    "{B/G}": "\ue602/\ue604",
    "{U/B}": "\ue601/\ue602",
    "{U/R}": "\ue601/\ue603",
    "{R/G}": "\ue603/\ue604",
    "{R/W}": "\ue603/\ue600",
    "{G/W}": "\ue604/\ue600",
    "{G/U}": "\ue604/\ue601",
    "{B/G/P}": "\ue602/\ue604/\ue618",
    "{B/R/P}": "\ue602/\ue603/\ue618",
    "{G/U/P}": "\ue604/\ue601/\ue618",
    "{G/W/P}": "\ue604/\ue600/\ue618",
    "{R/G/P}": "\ue603/\ue604/\ue618",
    "{R/W/P}": "\ue603/\ue600/\ue618",
    "{U/B/P}": "\ue601/\ue602/\ue618",
    "{U/R/P}": "\ue601/\ue603/\ue618",
    "{W/B/P}": "\ue600/\ue602/\ue618",
    "{W/U/P}": "\ue600/\ue601/\ue618",
    "{2/W}": "\ue607/\ue600",
    "{2/U}": "\ue607/\ue601",
    "{2/B}": "\ue600/\ue602",
    "{2/R}": "\ue607/\ue603",
    "{2/G}": "\ue607/\ue604",
    "{P}": "\ue618",
    "{W/P}": "\ue600/\ue618",
    "{U/P}": "\ue601/\ue618",
    "{B/P}": "\ue602/\ue618",
    "{R/P}": "\ue603/\ue618",
    "{G/P}": "\ue604/\ue618",
    "{HW}": "\ue902\ue600",
    "{HR}": "\ue902\ue603",
    "{W}": "\ue600",
    "{U}": "\ue601",
    "{B}": "\ue602",
    "{R}": "\ue603",
    "{G}": "\ue604",
    "{C}": "\ue904",
    "{S}": "\ue619"
}