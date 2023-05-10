// noinspection JSUnresolvedReference

class SplitCard extends Card {
    constructor(scryCard, options) {
        super(scryCard, options)

        this.leftHalf = this.card.card_faces[0]
        this.rightHalf = this.card.card_faces[1]
    }

    resetAllComponents() {
        super.resetAllComponents()

        this.temp = null

        this.cardFacesSep = null
        this.leftCardText = null
        this.rightCardText = null
        this.nameTypeSep = null
        this.leftTypeText = null
        this.rightTypeText = null
        this.typeArtSep = null
        this.leftCostGroup = null
        this.rightCostGroup = null
        this.textBottomSep = null
        this.leftCardText = null
        this.rightCardText = null
        this.leftImg = null
        this.rightImg = null
        this.imgTextSep = null
    }

    colorBorder() {
        if ((this.card.colors && this.card.colors.length > 0)
            || (this.card.color_identity && this.card.color_identity.length > 0)) {
            this.border.strokeLinearGradientStartPoint({x: this.o.borderOffset, y: this.o.H / 2});
            this.border.strokeLinearGradientEndPoint({x: this.o.W - this.o.borderOffset, y: this.o.H / 2});
            if (this.card.colors && this.card.colors.length > 0) {
                this.border.strokeLinearGradientColorStops(getGradient(this.card.colors));
            } else if (this.card.color_identity && this.card.color_identity.length > 0) {
                this.border.strokeLinearGradientColorStops(getGradient(this.card.color_identity));
            }
        }
    }

    drawCardFacesSep() {
        this.cardFacesSep = this.newSeparator({
            x1: this.o.textStartX,
            y1: this.o.H / 2,
            x2: this.o.W - this.o.textStartX,
            y2: this.o.H / 2
        })
    }

    drawNameText() {
        this.leftNameText = this.newText({
            x: this.o.textStartX,
            y: this.o.H - this.o.textStartY,
            text: this.leftHalf.name,
            width: (this.o.H - this.o.textStartY) / 2,
            rotation: 270
        })

        this.rightNameText = this.newText({
            x: this.o.textStartX,
            y: this.o.H / 2,
            text: this.rightHalf.name,
            width: this.leftNameText.width(),
            rotation: 270
        })
    }

    drawNameTypeSep() {
        this.nameTypeSep = this.newSeparator({
            x1: this.leftNameText.x() + this.leftNameText.height() + this.o.elemDistance,
            y1: this.leftNameText.y(),
            x2: this.leftNameText.x() + this.leftNameText.height() + this.o.elemDistance,
            y2: this.o.textStartY
        })
    }

    drawTypeText() {
        this.leftTypeText = this.newText({
            x: this.nameTypeSep.points()[0] + 2 * this.o.elemDistance,
            y: this.o.H - this.o.textStartY,
            text: this.leftHalf.type_line,
            size: this.o.textSize,
            width: (this.o.H - this.o.textStartY) / 2,
            rotation: 270
        })

        this.rightTypeText = this.newText({
            x: this.leftTypeText.x(),
            y: this.o.H / 2,
            text: this.rightHalf.type_line,
            size: this.o.textSize,
            width: this.leftTypeText.width(),
            rotation: 270
        })
    }

    drawTypeArtSep() {
        this.typeArtSep = this.newSeparator({
            x1: this.leftTypeText.x() + this.leftTypeText.height() + this.o.elemDistance,
            y1: this.leftTypeText.y(),
            x2: this.leftTypeText.x() + this.leftTypeText.height() + this.o.elemDistance,
            y2: this.o.textStartY
        })
    }

    drawBottomSection() {
        this.newTempElement()
        this.temp.x(this.o.W - this.temp.height() - 2 * this.o.borderOffset)

        // mana cost
        if (this.leftHalf.mana_cost && this.leftHalf.mana_cost.length > 0) {
            this.drawLeftCostGroup()
        }
        if (this.rightHalf.mana_cost && this.rightHalf.mana_cost.length > 0) {
            this.drawRightCostGroup()
        }

        // separator between lower elements and card text
        if (this.leftCostGroup != null || this.rightCostGroup != null)
            this.drawTextBottomSep()

        this.freeTempElement()
    }

    drawLeftCostGroup() {
        this.leftCostGroup = newCostGroup(this.leftHalf.mana_cost);
        this.leftCostGroup.rotation(270)
        this.leftCostGroup.x(this.o.W - this.temp.height() - 2 * this.o.borderOffset + this.o.powtouTextDistance);
        this.leftCostGroup.y(this.leftNameText.y() - this.o.borderOffset);
    }

    drawRightCostGroup() {
        this.rightCostGroup = newCostGroup(this.rightHalf.mana_cost);
        this.rightCostGroup.rotation(270)
        this.rightCostGroup.x(this.o.W - this.temp.height() - 2 * this.o.borderOffset + this.o.powtouTextDistance);
        this.rightCostGroup.y(this.rightNameText.y() - 2 * this.o.borderOffset);
    }

    drawTextBottomSep() {
        this.textBottomSep = this.newSeparator({
            x1: this.temp.x() - this.o.borderOffset,
            y1: this.leftNameText.y(),
            x2: this.temp.x() - this.o.borderOffset,
            y2: this.o.textStartY
        })
    }

    drawCardText() {
        this.leftCardText = new Konva.Text({
            x: this.typeArtSep.points()[0] + this.o.elemDistance,
            y: this.leftNameText.y(),
            text: format_oracle(this.leftHalf.oracle_text),
            fontSize: this.o.oracleSize,
            fontFamily: "Open Sans",
            align: "left",
            width: this.o.verticalTextWidth,
            lineHeight: 1.1,
            fill: 'black',
            rotation: 270
        })

        this.rightCardText = new Konva.Text({
            y: this.rightNameText.y() - this.o.borderOffset,
            text: format_oracle(this.rightHalf.oracle_text),
            fontSize: this.o.oracleSize,
            fontFamily: "Open Sans",
            align: "left",
            width: this.o.verticalTextWidth,
            lineHeight: 1.1,
            fill: 'black',
            rotation: 270
        })

        const textStop = this.textBottomSep != null ? this.textBottomSep.points()[0] - 2 * this.o.elemDistance : this.o.W - 2 * this.o.borderOffset
        this.leftCardText.x(textStop - this.leftCardText.height())
        this.rightCardText.x(textStop - this.rightCardText.height())
    }

    async drawCardImage() {
        const tallest = this.leftCardText.height() >= this.rightCardText.height() ? this.leftCardText : this.rightCardText
        let remaining_space = tallest.x() - this.typeArtSep.points()[0] - 2 * this.o.elemDistance
        if (remaining_space > 0) {
            const imgLoadPromise = new Promise(resolve => {
                const imageObj = new Image();
                imageObj.onload = () => {
                    this.leftImg = new Konva.Image({image: imageObj, rotation: 270});
                    this.rightImg = new Konva.Image({image: imageObj, rotation: 270});

                    // separate the images in the two halves
                    this.leftImg.crop({x: 0, y: 0, width: this.leftImg.width() / 2, height: this.leftImg.height()})
                    this.leftImg.width(this.leftImg.width() / 2)
                    this.rightImg.crop({
                        x: this.rightImg.width() / 2,
                        y: 0,
                        width: this.rightImg.width() / 2,
                        height: this.rightImg.height()
                    })
                    this.rightImg.width(this.rightImg.width() / 2)

                    // until it doesn't fit, scale it down
                    let currentScale = this.o.maxImageScale
                    while (this.leftImg.height() > remaining_space && currentScale >= this.o.minImageScale) {
                        this.leftImg.width(this.o.textWidth * currentScale / 2)
                        this.leftImg.height(imageObj.height * (this.o.textWidth / imageObj.width) * currentScale)
                        this.rightImg.width(this.o.textWidth * currentScale / 2)
                        this.rightImg.height(imageObj.height * (this.o.textWidth / imageObj.width) * currentScale)
                        currentScale = currentScale - this.o.scaleDecrement
                    }

                    // if it fits, center the art then move the text (and a separator) underneath it
                    if (this.leftImg.height() <= remaining_space) {
                        this.leftImg.y(this.leftNameText.y() - ((this.leftNameText.y() - this.o.H / 2) - this.leftImg.width()) / 2)
                        this.leftImg.x(this.typeArtSep.points()[0] + this.o.elemDistance)
                        this.rightImg.y((this.o.H / 2) - (this.rightNameText.width() - this.rightImg.width()) / 2)
                        this.rightImg.x(this.leftImg.x())
                        this.drawImgTextSep()
                        this.leftCardText.x(this.imgTextSep.points()[0] + 2 * this.o.elemDistance)
                        this.rightCardText.x(this.imgTextSep.points()[0] + 2 * this.o.elemDistance)
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
            x1: this.leftImg.x() + this.leftImg.height() + this.o.elemDistance,
            y1: this.leftNameText.y(),
            x2: this.leftImg.x() + this.leftImg.height() + this.o.elemDistance,
            y2: this.o.textStartY
        })
    }

    async draw() {
        super.draw()

        // separator between the two halves
        this.drawCardFacesSep()
        this.cardGroup.add(this.cardFacesSep)

        // card name
        this.drawNameText()
        this.cardGroup.add(this.leftNameText)
        this.cardGroup.add(this.rightNameText)

        // separator between name and type
        this.drawNameTypeSep()
        this.cardGroup.add(this.nameTypeSep)

        // card type
        this.drawTypeText()
        this.cardGroup.add(this.leftTypeText)
        this.cardGroup.add(this.rightTypeText)

        // separator between type and art/text
        this.drawTypeArtSep()
        this.cardGroup.add(this.typeArtSep)

        this.drawBottomSection()
        if (this.leftCostGroup != null) this.cardGroup.add(this.leftCostGroup)
        if (this.rightCostGroup != null) this.cardGroup.add(this.rightCostGroup)
        if (this.leftCostGroup != null || this.rightCostGroup != null) this.cardGroup.add(this.textBottomSep)

        // card oracle text
        this.drawCardText()

        // Add card art if there is available space
        await this.drawCardImage()
        if (this.leftImg != null) this.cardGroup.add(this.leftImg)
        if (this.rightImg != null) this.cardGroup.add(this.rightImg)
        if (this.imgTextSep != null) this.cardGroup.add(this.imgTextSep)

        // it's here to show it only after its position is correctly set
        this.cardGroup.add(this.leftCardText)
        this.cardGroup.add(this.rightCardText)
    }
}