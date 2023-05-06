// noinspection JSUnresolvedReference

const elem = document.getElementById('draw-shapes');

const drawMul = 7
const pageW = 210
const pageH = 297
const cardsPerPage = 10
const C1 = 2, R1 = 3 // vertical cards (on the left)
const C2 = 1, R2 = 4 // horizontal cards (on the right)
const cardW = 63
const cardH = 84
const dashSize = [2, 2]

const globalDefaultOptions = {
    W: cardW, // card width
    H: cardH, // card height
    borderRadius: 3,
    borderOffset: 2, // distance from the border
    textSize: 3.9, //+ 0.2;
    oracleSize: 3, //+ 0.3;
    powtouSize: 6,
    maxImageScale: 0.8,
    minImageScale: 0.2,
    scaleDecrement: 0.05,
    borderW: function () {
        return this.W - this.borderOffset * 2
    },
    borderH: function () {
        return this.H - this.borderOffset * 2
    },
    textStartX: function () {
        return this.borderOffset * 2
    },
    textStartY: function () {
        return this.borderOffset * 2
    },
    textWidth: function () {
        return this.W - this.borderOffset * 4
    },
    verticalTextWidth: function () {
        return (this.H / 2) - this.borderOffset * 4
    },
    lineStart: function () {
        return this.W - 2 * this.borderOffset
    },
    elemDistance: function () {
        return this.borderOffset / 2
    }, // = 1
    powtouTextDistance: function () {
        return 3 * this.elemDistance()
    },
}

$(async () => {
    await fetch(
        "https://api.scryfall.com/catalog/card-names"
    ).then(async (value) => {
        if (value.ok) {
            let response = await value.json();
            $("#cards").autocomplete("option", "source", response.data)
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
        let inp = $("#cards")
        if (inp.val() !== "") {
            let area = document.getElementById("area")
            area.value += (area.value.slice(-1) === "\n" || area.value.length === 0 ? "" : "\n") + $("#amount").val() + " " + inp.val() + "\n"
            inp.val("")
        }
    })

    $("#update-button").on("click", async () => {
        // reset canvas
        elem.replaceChildren(...[]);

        // reset progress bar
        let progressBar = $('#progress')
        progressBar.css('width', "0%").attr('aria-valuenow', 0);
        progressBar.removeClass("bg-success")

        // disable download button
        let download_button = $('#download-button')
        download_button.prop('disabled', true);

        const raw = document.getElementById("area").value.trim();
        const lines = raw.match(/[^\r\n)]+/g);

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
            const fetch_name = entry.split("//")[0]
            if (/\S/.test(fetch_name)) {
                to_fetch.push(fetch_name);
                // a number of duplicate entries equal to the asked amount is added
                entries.push(...Array.from({length: amount}, () => (entry)));
            }
        }

        let card_list = [] // card objects retrieved from scryfall
        while (to_fetch.length) {
            await fetch_collection(to_fetch.splice(0, 75).map((n) => {
                return {name: n}
            }))
                .then((response) => card_list = [...card_list, ...response.data])
        }

        let skipped = [] // cards not found
        let to_print = [] // the actual cards that will form the pages
        for (const entry of entries) {
            let found = card_list.find((card) => card.name.toLocaleLowerCase() === entry.toLocaleLowerCase());
            if (found) {
                if (!found.type_line.includes("Basic")) {
                    if (found.layout !== "split" && found.card_faces && found.card_faces.length > 0) {
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
            $('#skipped').text("Skipped:" + skipped.map((e) => " " + e))
        }

        // progress bar
        const max = to_print.length;
        let processed = 0;

        function updateBar() {
            processed++;
            let progress = (processed / max * 100);
            progressBar.css('width', progress + "%").attr('aria-valuenow', progress);
            if (progress === 100) {
                progressBar.addClass("bg-success")
            }
        }

        // disclaimer
        if (max > 0) {
            $('#anteprima').html("");
        }

        // creazione carte
        const card_container = $('#boot-cards')
        card_container.empty()
        let card_groups = []
        for (let i = 0; i < to_print.length; i++) {
            const c = to_print[i]
            if (c.layout === "split") {
                pageGroup.add(await drawSplitCard(new Konva.Group({x: cardW * x, y: cardH * y}), c));
            } else {
                const card = new Card(c, globalDefaultOptions)
                await card.draw()
                const group = card.cardGroup

                let new_elem =
                    '<div class="col"><div class="card border-dark m-2">' +
                    '   <div class="card-body p-0">' +
                    '       <div id="card-' + i + '">Loading...</div>' +
                    '   </div>' +
                    '   <div class="card-footer  ">' +
                    '       <div class="row">' +
                    '           <select class="col form-select" id="select-' + i + '">'
                card.prints.forEach((p) => {
                    new_elem += '   <option value="' + p.code + '-' + p.collector + '">' + p.set_name + ' (#' + p.collector + ')</option>'
                })
                new_elem +=
                    '           </select>' +
                    '           <div class="col-auto btn-group" role="group">' +
                    '               <button id="minus-' + i + '" type="button" class="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-html="true" data-bs-title="Decrease<br>text size">-</button>' +
                    '               <button id="plus-' + i + '" type="button" class="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-title="Increase<br>text size">+</button>' +
                    '           </div>' +
                    '       </div>' +
                    '   </div>' +
                    '</div></div>'

                card_container.append(new_elem)

                const card_elem = $("#card-" + i)

                let stage = new Konva.Stage({
                    container: card_elem.attr('id'),
                    width: card_elem.width(),
                    height: card_elem.height()
                })

                let layer = new Konva.Layer();
                layer.add(group);
                stage.add(layer);
                layer.draw()

                card_groups.push(group)

                $("#select-" + i).on('change', async function (e) {
                    card.selected = this.value
                    await card.redraw()

                    layer.draw()
                });

                $('#minus-' + i).on('click', async () => {
                    if (card.o.oracleSize >= 1.5) {
                        card.o.oracleSize -= 0.25
                        await card.redraw()

                        layer.draw()
                    }
                })

                $('#plus-' + i).on('click', async () => {
                    card.o.oracleSize += 0.25
                    await card.redraw()

                    layer.draw()
                })

                function fitStageIntoParentContainer() {
                    const containerWidth = $('#card-' + i).width();
                    const scale = containerWidth / cardW;

                    stage.width(cardW * scale);
                    stage.height(cardH * scale);
                    stage.scale({x: scale, y: scale});
                }

                fitStageIntoParentContainer();
                window.addEventListener('resize', fitStageIntoParentContainer);

                updateBar()
            }
        }

        // bootstrap tooltips must be enabled
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

        if (max > 0) {
            download_button.on('click', (event) => {
                if (!event.detail || event.detail === 1) { // prevents multiple clicks

                    // creazione pagine
                    let images = [];
                    let pageId = 0;
                    let total = 0
                    while (total < card_groups.length) {
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

                        let cards = card_groups.slice(total, total + cardsPerPage);
                        let n = 0;

                        // vertical cards
                        for (let y = 0; y < R1; y++) {
                            for (let x = 0; x < C1; x++) {
                                if (n < cards.length) {
                                    const group = cards[n].clone()
                                    group.x(cardW * x)
                                    group.y(cardH * y)

                                    pageGroup.add(group)
                                    pageGroup.add(
                                        new Konva.Line({
                                            points: [cardW * (x + 1), cardH * y, cardW * (x + 1), cardH * (y + 1), cardW * (x), cardH * (y + 1), cardW * (x + 1), cardH * (y + 1)],
                                            stroke: 'black', strokeWidth: 0.1, dash: dashSize,
                                        }));
                                    n++;

                                }
                            }
                        }

                        // horizontal cards
                        for (let i = 0; i < C2; i++) {
                            for (let j = 0; j < R2; j++) {
                                if (n < cards.length) {
                                    const group = cards[n].clone()
                                    group.x((C1 * cardW) + (cardH * i))
                                    group.y(cardW * (j + 1))
                                    group.rotation(270)

                                    pageGroup.add(group)
                                    pageGroup.add(
                                        new Konva.Line({
                                            points: [(C1 * cardW) + (cardH * i), cardW * (j + 1), (C1 * cardW) + (cardH * (i + 1)), cardW * (j + 1)],
                                            stroke: 'black', strokeWidth: 0.1, dash: dashSize,
                                        }));
                                    // a line is missing, but it isn't shown in the current configuration anyway
                                    n++;
                                }
                            }
                        }

                        // A4 page border
                        pageGroup.add(new Konva.Rect({width: pageW, height: pageH, stroke: "white", strokeWidth: 0.5,})
                        );

                        // the image is saved at a high resolution
                        let pageStage = new Konva.Stage({
                            container: newPage.id,
                            width: pageW * drawMul,
                            height: pageH * drawMul,
                        })
                        pageGroup.scale({x: drawMul, y: drawMul});
                        layer.add(pageGroup);
                        pageStage.add(layer);
                        images.push(pageStage.toDataURL({pixelRatio: 1}));
                        pageStage.destroy()

                        pageId++;
                        total += n;
                    }

                    download_button.prop('disabled', true);
                    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4', true);

                    for (const [i, image] of images.entries()) {
                        pdf.addImage(image, 0, 0, pageW, pageH);
                        if (i !== images.length - 1)
                            pdf.insertPage();
                    }
                    const fileName = ($("#download-name").val() || "proxy") + ".pdf"
                    pdf.save(fileName, {returnPromise: true}).then(() => download_button.prop('disabled', false))
                }
            });
            download_button.prop('disabled', false)
        }
    });
});

async function fetch_collection(ids) {
    return fetch("https://api.scryfall.com/cards/collection", {
        method: "POST", headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifiers: ids})
    }).then(async r => {
        return await r.json();
    })
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
        border.strokeLinearGradientStartPoint({x: borderOffset, y: cardH / 2});
        border.strokeLinearGradientEndPoint({x: cardW - borderOffset, y: cardH / 2});
        if (card.colors && card.colors.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.colors));
        } else if (card.color_identity && card.color_identity.length > 0) {
            border.strokeLinearGradientColorStops(getGradient(card.color_identity));
        }
    }
    cardGroup.add(border);

    // separator between faces
    let sep = new Konva.Line({
        points: [textStartX, cardH / 2, cardW - textStartX, cardH / 2],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep)

    // card names
    let leftNameText = new Konva.Text({
        x: textStartX,
        y: cardH - textStartY,
        width: (cardH - textStartY) / 2,
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
        y: cardH / 2,
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
            leftNameText.x() + leftNameText.height() + elemDistance, textStartY],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep1)

    // card types
    let leftTypeText = new Konva.Text({
        x: sep1.points()[0] + 2 * elemDistance,
        y: cardH - textStartY,
        width: (cardH - textStartY) / 2,
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
        y: cardH / 2,
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
            leftTypeText.x() + leftTypeText.height() + elemDistance, textStartY],
        stroke: "black",
        strokeWidth: 0.1
    })
    cardGroup.add(sep2)

    // lower bound for text
    let textStop = cardW - 2 * borderOffset

    // add cost (if present)
    if (leftFace.mana_cost && leftFace.mana_cost.length > 0) {

        bottomRightText = "";

        // temp element to compute size
        const temp = new Konva.Text({
            text: bottomRightText,
            fontSize: powtouSize,
            fontFamily: "Roboto Condensed",
            rotation: 270
        })
        temp.x(cardW - temp.height() - 2 * borderOffset);

        // mana cost
        if (leftFace.mana_cost && leftFace.mana_cost.length > 0) {
            costGroup = newCostGroup(leftFace.mana_cost);
            costGroup.rotation(270)
            costGroup.x(temp.x() + powtouTextDistance);
            costGroup.y(leftNameText.y() - borderOffset);
            cardGroup.add(costGroup);
        }

        // separator between lower elements and card text
        let sep3 = new Konva.Line({
            points: [temp.x() - borderOffset, leftNameText.y(), temp.x() - borderOffset, textStartY],
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
        const temp = new Konva.Text({
            text: bottomRightText,
            fontSize: powtouSize,
            fontFamily: "Roboto Condensed",
            rotation: 270
        })
        temp.x(cardW - temp.height() - 2 * borderOffset);

        // mana cost
        if (rightFace.mana_cost && rightFace.mana_cost.length > 0) {
            costGroup = newCostGroup(rightFace.mana_cost);
            costGroup.rotation(270)
            costGroup.x(temp.x() + powtouTextDistance);
            costGroup.y(rightNameText.y() - 2 * borderOffset);
            cardGroup.add(costGroup);
        }
    }

    // card oracle text
    let left_oracle_text = leftFace.oracle_text.replace(/ *\([^)]*\) */g, "")
    let leftCardText = new Konva.Text({
        x: sep2.points()[0] + elemDistance,
        y: leftNameText.y(),
        text: left_oracle_text.replace(/\{[^{]+}/g, s => symbol_dic[s]),
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
        text: right_oracle_text.replace(/\{[^{]+}/g, s => symbol_dic[s]),
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
                var leftImg = new Konva.Image({image: imageObj, rotation: 270});
                var rightImg = new Konva.Image({image: imageObj, rotation: 270});

                leftImg.crop({x: 0, y: 0, width: leftImg.width() / 2, height: leftImg.height()})
                leftImg.width(leftImg.width() / 2)
                rightImg.crop({x: rightImg.width() / 2, y: 0, width: rightImg.width() / 2, height: rightImg.height()})
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
                    leftImg.y(leftNameText.y() - ((leftNameText.y() - cardH / 2) - leftImg.width()) / 2)
                    leftImg.x(sep2.points()[0] + elemDistance)
                    rightImg.y((cardH / 2) - (rightNameText.width() - rightImg.width()) / 2)
                    rightImg.x(leftImg.x())

                    let sep5 = new Konva.Line({
                        points: [leftImg.x() + leftImg.height() + elemDistance, leftNameText.y(), leftImg.x() + leftImg.height() + elemDistance, textStartY],
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

// TODO: Split, Flip, Double, Meld, Leveler, Class, Saga, Battle, Adventure, Planeswalker
// TODO: Cambiare orientamento gradiente bordi?
// TODO: aggiungere nome artista (magari in bianco in parte inferiore art)
// TODO: utente può cambiare parametri
// TODO: Indentazione abilità planeswalker e spazio tra paragrafi
