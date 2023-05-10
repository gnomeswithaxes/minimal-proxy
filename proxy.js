// noinspection JSUnresolvedReference

const elem = document.getElementById('draw-shapes');

const scryfallPageLength = 75
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
    get borderW() {
        return this.W - this.borderOffset * 2
    },
    get borderH() {
        return this.H - this.borderOffset * 2
    },
    get textStartX() {
        return this.borderOffset * 2
    },
    get textStartY() {
        return this.borderOffset * 2
    },
    get textWidth() {
        return this.W - this.borderOffset * 4
    },
    get verticalTextWidth() {
        return (this.H / 2) - this.borderOffset * 4
    },
    get lineStart() {
        return this.W - 2 * this.borderOffset
    },
    get elemDistance() {
        return this.borderOffset / 2
    }, // = 1
    get powtouTextDistance() {
        return 3 * this.elemDistance
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

let card_faces = []

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

    const download_button = $('#download-button')
    download_button.prop('disabled', true);
    download_button.on('click', (event) => {
        if (!event.detail || event.detail === 1) { // prevents multiple clicks
            download_button.prop('disabled', true);
            createPDF()
        }
    });

    $("#update-button").on("click", async () => {
        // reset canvas
        elem.replaceChildren(...[]);

        // reset progress bar
        let progressBar = $('#progress')
        progressBar.css('width', "0%").attr('aria-valuenow', 0);
        progressBar.removeClass("bg-success")

        // disable download button and empty card_groups
        download_button.prop('disabled', true);

        // empty skipped
        let skipped_elem = $('#skipped')
        skipped_elem.text("")

        // parse the text area
        const raw = document.getElementById("area").value.trim();
        let entries = parseLines(raw)

        // retrieve card objects from scryfall
        let card_list = []
        for (let i = 0; i < entries.length; i += scryfallPageLength) {
            const query = entries.slice(i, i + scryfallPageLength).map((e) => {
                return {name: e.fetch_name}
            })
            await fetch_collection(query)
                .then((response) => card_list = [...card_list, ...response.data])
        }

        // assign card objects to the entries
        let skipped = []
        card_faces = []
        for (let entry of entries) {
            let found = card_list.find((card) => card.name.toLocaleLowerCase() === entry.name.toLocaleLowerCase() ||
                card.name.toLocaleLowerCase().split("//")[0].trim() === entry.fetch_name.toLocaleLowerCase()) // sometimes lists are exported with only the first half of the name
            if (found) {
                if (!found.type_line.includes("Basic")) { // basic lands are skipped because why would you proxy them
                    entry.scrycard = found
                    card_faces.push(entry)
                    if (found.card_faces && found.card_faces.length > 0 && found.layout !== "split") {
                        const new_entry = Object.assign({}, entry)
                        entry.face = found.card_faces[0]
                        new_entry.face = found.card_faces[1]
                        card_faces.push(new_entry)
                    } else {
                        entry.face = found
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
            let skipped_text = "Skipped: <ul>"

            for (const e of skipped) {
                skipped_text += "<li>" + e.name + "</li>"
            }
            skipped_text += "</ul>"
            skipped_elem.html(skipped_text)
        }

        // progress bar
        const max = card_faces.length;
        let processed = 0;

        function updateBar() {
            processed++;
            let progress = (processed / max * 100);
            progressBar.css('width', progress + "%").attr('aria-valuenow', progress);
            if (progress === 100) {
                progressBar.addClass("bg-success")
                download_button.prop('disabled', false)
            }
        }

        // disclaimer
        if (max > 0) {
            $('#anteprima').html("");
        }

        // creazione carte
        const card_container = $('#boot-cards')
        card_container.empty()


        for (let i = 0; i < card_faces.length; i++) {
            const entry = card_faces[i]
            const card = cardFactory(entry)

            await card.draw()
            const group = card.cardGroup

            let new_elem =
                '<div class="col"><div class="card border-dark m-2">' +
                '   <div class="card-body p-0">' +
                '       <div id="card-' + i + '">Loading...</div>' +
                '   </div>' +
                '   <div class="card-footer">' +
                '       <div class="row">' +
                '           <div class="col-auto"><span class="input-group-text">' + entry.amount + '</span></div>' +
                '           <select class="col form-select" id="select-' + i + '">' +
                '               <option selected>Change art...</option>' +
                '               <option>Loading prints</option>' +
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

            entry.group = group

            const select = $("#select-" + i)

            select.on('click', async () => {
                if (card.prints == null) {
                    card.getPrints().then(() => {
                        let options = ""
                        card.prints?.forEach((p) => {
                            const value = p.code + '-' + p.collector
                            options += '<option value="' + value + '" ' + (value === card.selected ? "selected" : "") + '>' + p.set_name + ' (#' + p.collector + ')</option>'
                        })
                        select.html(options)
                    })
                }
            })

            select.on('change', async function (e) {
                if (card.prints != null) {
                    card.selected = this.value
                    await card.redraw()

                    layer.draw()
                }
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

        // bootstrap tooltips must be enabled
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    });
});

function createPDF() {
    let card_groups = []
    for (const entry of card_faces) {
        for (let i = 0; i < entry.amount; i++) {
            card_groups.push(entry.group.clone())
        }
    }

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
                    const group = cards[n]
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
                    const group = cards[n]
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

    const pdf = new window.jspdf.jsPDF({compress: true});

    for (const [i, image] of images.entries()) {
        pdf.addImage(image, 0, 0, pageW, pageH);
        if (i !== images.length - 1)
            pdf.insertPage();
    }

    const fileName = ($("#download-name").val() || "proxy") + ".pdf"
    pdf.save(fileName)
    $('#download-button').prop('disabled', false)
}

function cardFactory(entry) {
    let card;
    const c = entry.face
    if (c.layout === "split") {
        card = new SplitCard(entry.scrycard, globalDefaultOptions)
    } else if (c.type_line.includes("Saga") || c.layout === "class") {
        card = new SagaCard(entry.scrycard, globalDefaultOptions)
    } else {
        card = new NormalCard(entry.scrycard, globalDefaultOptions)
    }
    if (c.object === "card_face") {
        card.face = entry.face
    }
    return card
}

async function fetch_collection(ids) {
    return fetch("https://api.scryfall.com/cards/collection", {
        method: "POST", headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifiers: ids})
    }).then(async r => {
        return await r.json();
    })
}

function parseLines(text) {
    const lines = text.match(/[^\r\n)]+/g);
    let entries = []
    for (let l = 0; l < lines.length; l++) {
        let entry = {
            name: "",
            amount: 1,
            fetch_name: "",
            scrycard: null
        }
        let parts = lines[l].trim().split(" ")
        if (parts.length <= 1 || isNaN(parts[0])) {
            entry.name = lines[l]
        } else {
            entry.amount = parts[0]
            entry.name = parts.slice(1).join(" ")
        }
        // for some reason, double cards are only found when searching the first part
        const fetch_name = entry.name.split("//")[0]

        // empty lines are skipped
        if (/\S/.test(fetch_name)) {
            entry.fetch_name = fetch_name;
            // a number of duplicate entries equal to the asked amount is added
            entries.push(entry);
        }
    }

    return entries
}

// TODO: progress bar on download
// TODO: if land, color the border
// TODO: Meld, Leveler, Battle, Adventure, Planeswalker
// TODO: aggiungere nome artista (magari in bianco in parte inferiore art)
// TODO: utente può cambiare parametri
// TODO: Indentazione abilità planeswalker e spazio tra paragrafi
