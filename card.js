// noinspection JSUnresolvedReference

class Card {
    constructor(scryCard, options) {
        this.card = scryCard
        this.o = Object.assign({}, options)

        this.cardGroup = new Konva.Group()

        this.prints = null
        this.selected = null

        this.resetAllComponents()
    }

    resetAllComponents() {
        this.cardGroup.destroyChildren()

        this.border = null
        this.nameText = null
        this.nameTypeSep = null
        this.typeText = null
        this.typeArtSep = null

        this.bottomRightText = null
        this.textBottomSep = null
        this.costGroup = null

        this.cardText = null
        this.img = null
        this.imgTextSep = null
        this.verticalSep = null

        this.temp = null
    }

    // returns a list of cards corresponding to all prints
    async getPrints() {
        const cards = await this.fetchPrints();
        this.prints = cards.map((c) => {
            return {set_name: c.set_name, code: c.set, art: c.image_uris.art_crop, collector: c.collector_number}
        });
    }

    async fetchPrints() {
        return fetch(this.card.prints_search_uri, {
            method: "GET", headers: {'Content-Type': 'application/json'},
        }).then(async r => {
            return (await r.json()).data;
        })
    }

    drawBorder() {
        this.border = new Konva.Rect({
            x: this.o.borderOffset,
            y: this.o.borderOffset,
            width: this.o.borderW(),
            height: this.o.borderH(),
            stroke: "gray",
            strokeWidth: 0.5,
            fill: null,
            cornerRadius: this.o.borderRadius
        })

        // adds the appropriate gradient if the this.card is not colorless
        if ((this.card.colors && this.card.colors.length > 0) || (this.card.color_identity && this.card.color_identity.length > 0)) {
            this.border.strokeLinearGradientStartPoint({x: this.o.W / 2, y: this.o.borderOffset});
            this.border.strokeLinearGradientEndPoint({x: this.o.W / 2, y: this.o.H - this.o.borderOffset});
            if (this.card.colors && this.card.colors.length > 0) {
                this.border.strokeLinearGradientColorStops(getGradient(this.card.colors));
            } else if (this.card.color_identity && this.card.color_identity.length > 0) {
                this.border.strokeLinearGradientColorStops(getGradient(this.card.color_identity));
            }
        }
    }

    drawNameText() {
        this.nameText = this.newText({
            x: this.o.textStartX(),
            y: this.o.textStartY(),
            size: this.o.textSize,
            text: this.card.name
        })
    }

    drawNameTypeSep() {
        this.nameTypeSep = this.newSeparator({
            x1: this.o.lineStart(),
            y1: this.nameText.y() + this.nameText.height() + this.o.elemDistance(),
            x2: this.o.W - this.o.lineStart(),
            y2: this.nameText.y() + this.nameText.height() + this.o.elemDistance()
        })
    }

    drawTypeText() {
        this.typeText = this.newText({
            x: this.o.textStartX(),
            y: this.nameTypeSep.points()[1] + 2 * this.o.elemDistance(),
            size: this.o.textSize,
            text: this.card.type_line
        })
    }

    drawTypeArtSep() {
        this.typeArtSep = this.newSeparator({
            x1: this.o.lineStart(),
            y1: this.typeText.y() + this.typeText.height() + this.o.elemDistance(),
            x2: this.o.W - this.o.lineStart(),
            y2: this.typeText.y() + this.typeText.height() + this.o.elemDistance()
        })
    }

    drawBottomSection() {
        let bottomRightText = "";
        if (this.card.power) {
            bottomRightText = this.card.power.trim() + "/" + this.card.toughness.trim();
        } else if (this.card.loyalty) {
            bottomRightText = " " + this.card.loyalty + " ";
        }

        // temp element to compute size
        this.newTempElement(bottomRightText)

        // mana cost
        if (this.card.mana_cost && this.card.mana_cost.length > 0) {
            this.drawCostGroup()
        }

        // separator between lower elements and card text
        this.drawTextBottomSep()

        // real element for bottom right text
        if (bottomRightText.length > 0) {
            this.drawBottomRightText(bottomRightText)

            // vertical separator between cost and bottom right text
            this.drawVerticalSep()
        }

        this.freeTempElement()
    }

    drawCostGroup() {
        this.costGroup = newCostGroup(this.card.mana_cost);
        this.costGroup.x(this.o.textStartX() + this.o.borderOffset);
        this.costGroup.y(this.temp.y() + this.o.powtouTextDistance());
    }

    drawTextBottomSep() {
        this.textBottomSep = this.newSeparator({
            x1: this.o.lineStart(),
            y1: this.temp.y() - this.o.borderOffset,
            x2: this.o.W - this.o.lineStart(),
            y2: this.temp.y() - this.o.borderOffset
        })
    }

    drawBottomRightText(text) {
        this.bottomRightText = this.newText({
            x: this.o.textStartX(),
            y: this.textBottomSep.points()[1] + this.textBottomSep.strokeWidth() + (this.o.H - this.o.borderOffset - this.textBottomSep.points()[1] - this.temp.height()) / 2,
            size: this.o.powtouSize,
            text: text,
        })
        this.bottomRightText.align('right')
    }

    drawVerticalSep() {
        this.verticalSep = this.newSeparator({
            x1: this.o.W - this.temp.width() - 2 * this.o.borderOffset - this.o.elemDistance(),
            y1: this.temp.y() - this.o.borderOffset,
            x2: this.o.W - this.temp.width() - 2 * this.o.borderOffset - this.o.elemDistance(),
            y2: this.o.H - this.o.borderOffset - this.o.elemDistance()
        })
    }

    drawCardText() {
        let oracle_text = this.card.oracle_text.replace(/ *\([^)]*\) */g, "")
        this.cardText = new Konva.Text({
            x: this.o.textStartX(),
            text: oracle_text.replace(/\{[^{]+}/g, s => symbol_dic[s]),
            fontSize: this.o.oracleSize,
            fontFamily: "Open Sans",
            align: "left",
            width: this.o.textWidth(),
            lineHeight: 1.1,
            fill: 'black',
        })
        const textStop = this.textBottomSep ? this.textBottomSep.points()[1] - this.o.borderOffset : this.o.H - 2 * this.o.borderOffset
        this.cardText.y(textStop - this.cardText.height())
    }

    async drawCardImage() {
        if (this.prints == null) await this.getPrints()
        let remaining_space = this.cardText.y() - this.typeArtSep.points()[1] - 2 * this.o.elemDistance()
        if (remaining_space > 0) {

            const imgLoadPromise = new Promise(resolve => {
                const imageObj = new Image();
                imageObj.onload = () => {
                    this.img = new Konva.Image({image: imageObj});

                    // until it doesn't fit, scale it down 0.1
                    let currentScale = this.o.maxImageScale
                    while (this.img.height() > remaining_space && currentScale >= this.o.minImageScale) {
                        this.img.width(this.o.textWidth() * currentScale)
                        this.img.height(imageObj.height * (this.o.textWidth() / imageObj.width) * currentScale)
                        currentScale = currentScale - this.o.scaleDecrement
                    }

                    // if it fits, center the art then move the text (and a separator) underneath it
                    if (this.img.height() <= remaining_space) {
                        this.img.x((this.o.W - this.img.width()) / 2)
                        this.img.y(this.typeArtSep.points()[1] + this.o.elemDistance())
                        this.drawImgTextSep()
                        this.cardText.y(this.imgTextSep.points()[1] + 2 * this.o.elemDistance());
                    } else {
                        this.img = null
                    }
                    resolve();
                };
                imageObj.setAttribute('crossOrigin', 'anonymous');

                if (this.selected != null)
                    imageObj.src = this.prints.find(p => {
                        const [code, collector] = this.selected.split("-")
                        return p.code === code && p.collector === collector
                    }).art
                else {
                    const first = this.prints[0]
                    this.selected = first.code + "-" + first.collector
                    imageObj.src = first.art
                }
            })
            // wait for the image to load
            await imgLoadPromise;
        }
    }

    drawImgTextSep() {
        this.imgTextSep = this.newSeparator({
            x1: this.o.lineStart(),
            y1: this.img.y() + this.img.height() + this.o.elemDistance(),
            x2: this.o.W - this.o.lineStart(),
            y2: this.img.y() + this.img.height() + this.o.elemDistance()
        })
    }

    newTempElement(text = "") {
        this.temp = new Konva.Text({
            text: text, fontSize: this.o.powtouSize, fontFamily: "Roboto Condensed",
        })
        this.temp.y(this.o.H - this.temp.height() - 2 * this.o.borderOffset);
    }

    freeTempElement() {
        this.temp.destroy()
        this.temp = null
    }

    async draw() {
        // card outer border
        this.drawBorder()
        this.cardGroup.add(this.border)

        // card name
        this.drawNameText()
        this.cardGroup.add(this.nameText)

        // separator between name and type
        this.drawNameTypeSep()
        this.cardGroup.add(this.nameTypeSep)

        // card type
        this.drawTypeText()
        this.cardGroup.add(this.typeText)

        // separator between type and art/text
        this.drawTypeArtSep()
        this.cardGroup.add(this.typeArtSep)

        // add power/toughness, loyalty, cost (if present)
        if ((this.card.power && this.card.power.length > 0) || (this.card.toughness && this.card.toughness.length > 0)
            || (this.card.mana_cost && this.card.mana_cost.length > 0) || this.card.loyalty && this.card.loyalty.length > 0) {

            // entire bottom section
            this.drawBottomSection()
            if (this.costGroup != null) this.cardGroup.add(this.costGroup);
            if (this.bottomRightText != null) {
                this.cardGroup.add(this.bottomRightText)
                this.cardGroup.add(this.verticalSep);
            }
            if (this.costGroup != null || this.bottomRightText != null) this.cardGroup.add(this.textBottomSep);
        }

        // card oracle text
        this.drawCardText()

        // Add card art if there is available space
        await this.drawCardImage()
        if (this.img != null) this.cardGroup.add(this.img);
        if (this.imgTextSep != null) this.cardGroup.add(this.imgTextSep);

        this.cardGroup.add(this.cardText); // it's here to show it only after its position is correctly set

        return this.cardGroup;
    }

    async redraw() { // TODO redraw only necessary
        this.resetAllComponents()
        await this.draw()
    }

    newText({x, y, size, text}) {
        return new Konva.Text({
            x: x,
            y: y,
            fontSize: size,
            text: text,
            width: this.o.textWidth(),
            fontFamily: "Roboto Condensed",
            align: 'center',
            fill: 'black',
        })
    }

    newSeparator({x1, y1, x2, y2}) {
        return new Konva.Line({
            points: [x1, y1, x2, y2],
            stroke: "black",
            strokeWidth: 0.1
        })
    }

}

function newCostGroup(cost) {
    let distance = 3;
    let Hsize = 2;
    let size = 1.75;

    const symbols = cost.split("}{").map((e) => {
        return e.replace("{", "").replace("}", "").trim()
    });

    if (symbols.length >= 7) {
        size = 1.5;
        distance = 2.5;
        Hsize = 1.4
    }

    const group = new Konva.Group();
    for (let i = 0; i < symbols.length; i++) {
        let symbol = symbols[i];
        if ("WUBRGC".includes(symbol)) {
            group.add(new Konva.Circle({
                x: i * (Hsize + distance), radius: size, stroke: colorFromIdentity(symbol), strokeWidth: 0.75,
            }))
        } else if (symbol.includes("/")) {
            let parts = symbol.split("/");
            const index = parts.indexOf("P");
            if (index > -1) {
                parts.splice(index, 1);
            }
            group.add(new Konva.Circle({
                x: i * (Hsize + distance),
                radius: (index > -1 ? size : Hsize),
                fillLinearGradientStartPoint: {x: 0, y: -Hsize},
                fillLinearGradientEndPoint: {x: 0, y: Hsize},
                fillLinearGradientColorStops: getGradient(parts),
                stroke: (index > -1 ? "black" : null),
                strokeWidth: 0.75,
            }));
        } else {
            group.add(new Konva.Text({
                x: i * (distance + Hsize) - 1, y: -Hsize, text: symbol, fontSize: 5, fontStyle: "bold",
            }))
        }
    }

    return group;
}

function getGradient(identity) {
    const colors = colorsArrayFromIdentity(identity, 50);
    let stops = []
    for (let n = 0; n < colors.length; n++) {
        const offset = n * (colors.length === 1 ? 1 : (1.0 / (colors.length - 1)));
        stops.push(offset, colors[n]);
    }
    return stops;
}

function colorsArrayFromIdentity(identity, times = 1) {
    let colors = []
    for (const i of identity) colors.push(...new Array(times).fill(colorFromIdentity(i)));
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

symbol_dic = {
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