// noinspection JSUnresolvedReference

class Card {
    constructor(scryCard, options) {
        this.card = scryCard
        this.o = Object.assign({}, options)

        this.actual_card = scryCard
        this.is_face = false

        this.cardGroup = new Konva.Group()

        this.prints = null
        this.selected = null

        this.resetAllComponents()
    }

    set face(face) {
        this.card = face
        this.is_face = true
    }

    resetAllComponents() {
        this.cardGroup.destroyChildren()
        this.border = null
    }

    // returns a list of cards corresponding to all prints
    async getPrints() {
        const cards = await this.fetchPrints();
        if (this.is_face) {
            this.prints = cards.map((c) => {
                const face = c.card_faces.find(f => f.name === this.card.name)
                return {set_name: c.set_name, code: c.set, art: face.image_uris.art_crop, collector: c.collector_number}
            });
        } else {
            this.prints = cards.map((c) => {
                return {set_name: c.set_name, code: c.set, art: c.image_uris.art_crop, collector: c.collector_number}
            });
        }
    }

    async fetchPrints() {
        return fetch(this.actual_card.prints_search_uri, {
            method: "GET", headers: {'Content-Type': 'application/json'},
        }).then(async r => {
            return (await r.json()).data;
        })
    }

    getImageSrc() {
        if (this.selected != null && this.prints != null)
            return this.prints.find(p => {
                const [code, collector] = this.selected.split("-")
                return p.code === code && p.collector === collector
            }).art
        else {
            this.selected = this.actual_card.set + "-" + this.actual_card.collector_number
            return this.card.image_uris.art_crop
        }
    }

    newText({x, y, text, size = this.o.textSize, width = this.o.textWidth, rotation = 0, align = "center"}) {
        return new Konva.Text({
            x: x,
            y: y,
            text: text,
            fontSize: size,
            width: width,
            rotation: rotation,
            fontFamily: "Roboto Condensed",
            align: align,
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

    drawBorder() {
        this.border = new Konva.Rect({
            x: this.o.borderOffset,
            y: this.o.borderOffset,
            width: this.o.borderW,
            height: this.o.borderH,
            stroke: "gray",
            strokeWidth: 0.5,
            fill: null,
            cornerRadius: this.o.borderRadius
        })
        this.colorBorder()
    }

    colorBorder() {
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

    draw() {
        // card outer border
        this.drawBorder()
        this.cardGroup.add(this.border)
    }

    async redraw() { // TODO redraw only necessary?
        this.resetAllComponents()
        await this.draw()
    }
}