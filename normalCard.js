// noinspection JSUnresolvedReference

class NormalCard extends Card {
    constructor(scryCard, options) {
        super(scryCard, options)
    }

    resetAllComponents() {
        super.resetAllComponents()

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

    drawNameText() {
        this.nameText = this.newText({
            x: this.o.textStartX,
            y: this.o.textStartY,
            text: this.card.name,
        })
    }

    drawNameTypeSep() {
        this.nameTypeSep = this.newSeparator({
            x1: this.o.lineStart,
            y1: this.nameText.y() + this.nameText.height() + this.o.elemDistance,
            x2: this.o.W - this.o.lineStart,
            y2: this.nameText.y() + this.nameText.height() + this.o.elemDistance
        })
    }

    drawTypeText() {
        this.typeText = this.newText({
            x: this.o.textStartX,
            y: this.nameTypeSep.points()[1] + 2 * this.o.elemDistance,
            text: this.card.type_line,
        })
    }

    drawTypeArtSep() {
        this.typeArtSep = this.newSeparator({
            x1: this.o.lineStart,
            y1: this.typeText.y() + this.typeText.height() + this.o.elemDistance,
            x2: this.o.W - this.o.lineStart,
            y2: this.typeText.y() + this.typeText.height() + this.o.elemDistance
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
        this.costGroup.x(this.o.textStartX + this.o.borderOffset);
        this.costGroup.y(this.temp.y() + this.o.powtouTextDistance);
    }

    drawTextBottomSep() {
        this.textBottomSep = this.newSeparator({
            x1: this.o.lineStart,
            y1: this.temp.y() - this.o.borderOffset,
            x2: this.o.W - this.o.lineStart,
            y2: this.temp.y() - this.o.borderOffset
        })
    }

    drawBottomRightText(text) {
        this.bottomRightText = this.newText({
            x: this.o.textStartX,
            y: this.textBottomSep.points()[1] + this.textBottomSep.strokeWidth() + (this.o.H - this.o.borderOffset - this.textBottomSep.points()[1] - this.temp.height()) / 2,
            text: text,
            size: this.o.powtouSize,
            align: 'right'
        })
    }

    drawVerticalSep() {
        this.verticalSep = this.newSeparator({
            x1: this.o.W - this.temp.width() - 2 * this.o.borderOffset - this.o.elemDistance,
            y1: this.temp.y() - this.o.borderOffset,
            x2: this.o.W - this.temp.width() - 2 * this.o.borderOffset - this.o.elemDistance,
            y2: this.o.H - this.o.borderOffset - this.o.elemDistance
        })
    }

    drawCardText() {
        this.cardText = new Konva.Text({
            x: this.o.textStartX,
            text: format_oracle(this.card.oracle_text),
            fontSize: this.o.oracleSize,
            fontFamily: "Open Sans",
            align: "left",
            width: this.o.textWidth,
            lineHeight: 1.1,
            fill: 'black',
        })
        const textStop = this.textBottomSep ? this.textBottomSep.points()[1] - this.o.borderOffset : this.o.H - 2 * this.o.borderOffset
        this.cardText.y(textStop - this.cardText.height())
    }

    async drawCardImage() {
        let remaining_space = this.cardText.y() - this.typeArtSep.points()[1] - 2 * this.o.elemDistance
        if (remaining_space > 0) {

            const imgLoadPromise = new Promise(resolve => {
                const imageObj = new Image();
                imageObj.onload = () => {
                    this.img = new Konva.Image({image: imageObj});

                    // until it doesn't fit, scale it down
                    let currentScale = this.o.maxImageScale
                    while (this.img.height() > remaining_space && currentScale >= this.o.minImageScale) {
                        this.img.width(this.o.textWidth * currentScale)
                        this.img.height(imageObj.height * (this.o.textWidth / imageObj.width) * currentScale)
                        currentScale = currentScale - this.o.scaleDecrement
                    }

                    // if it fits, center the art then move the text (and a separator) underneath it
                    if (this.img.height() <= remaining_space) {
                        this.img.x((this.o.W - this.img.width()) / 2)
                        this.img.y(this.typeArtSep.points()[1] + this.o.elemDistance)
                        this.drawImgTextSep()
                        this.cardText.y(this.imgTextSep.points()[1] + 2 * this.o.elemDistance);
                    } else {
                        this.img = null
                    }
                    resolve();
                };
                imageObj.setAttribute('crossOrigin', 'anonymous');
                imageObj.src = this.getImageSrc()
            })
            // wait for the image to load
            await imgLoadPromise;
        }
    }

    drawImgTextSep() {
        this.imgTextSep = this.newSeparator({
            x1: this.o.lineStart,
            y1: this.img.y() + this.img.height() + this.o.elemDistance,
            x2: this.o.W - this.o.lineStart,
            y2: this.img.y() + this.img.height() + this.o.elemDistance
        })
    }

    async draw() {
        super.draw()

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
    }
}