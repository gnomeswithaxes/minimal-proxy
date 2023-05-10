// noinspection JSUnresolvedReference


function format_oracle(text) {
    return text.replace(/ *\([^)]*\) *\n*/g, "").replace(/\{[^{]+}/g, s => symbol_dic[s])
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