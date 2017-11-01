firstNames = ["adamant", "adroit", "amatory", "animistic", "antic", "arcadian", "baleful", "bellicose", "bilious", "boorish", "calamitous", "caustic", "cerulean", "comely", "concomitant", "contumacious", "corpulent", "crapulous", "defamatory", "didactic", "dilatory", "dowdy", "efficacious", "effulgent", "egregious", "endemic", "equanimous", "execrable", "fastidious", "feckless", "fecund", "friable", "fulsome", "garrulous", "guileless", "gustatory", "heuristic", "histrionic", "hubristic", "incendiary", "insidious", "insolent", "intransigent", "inveterate", "invidious", "irksome", "jejune", "jocular", "judicious", "lachrymose", "limpid", "loquacious", "luminous", "mannered", "mendacious", "meretricious", "minatory", "mordant", "munificent", "nefarious", "noxious", "obtuse", "parsimonious", "pendulous", "pernicious", "pervasive", "petulant", "platitudinous", "precipitate", "propitious", "puckish", "querulous", "quiescent", "rebarbative", "recalcitant", "redolent", "rhadamanthine", "risible", "ruminative", "sagacious", "salubrious", "sartorial", "sclerotic", "serpentine", "spasmodic", "strident", "taciturn", "tenacious", "tremulous", "trenchant", "turbulent", "turgid", "ubiquitous", "uxorious", "verdant", "voluble", "voracious", "wheedling", "withering", "zealous"];
lastNames = ["ninja", "chair", "pancake", "statue", "unicorn", "rainbows", "laser", "senor", "bunny", "captain", "nibblets", "cupcake", "carrot", "gnomes", "glitter", "potato", "salad", "toejam", "curtains", "beets", "toilet", "exorcism", "stick figures", "mermaid eggs", "sea barnacles", "dragons", "jellybeans", "snakes", "dolls", "bushes", "cookies", "apples", "ice cream", "ukulele", "kazoo", "banjo", "opera singer", "circus", "trampoline", "carousel", "carnival", "locomotive", "hot air balloon", "praying mantis", "animator", "artisan", "artist", "colorist", "inker", "coppersmith", "director", "designer", "flatter", "stylist", "leadman", "limner", "make-up artist", "model", "musician", "penciller", "producer", "scenographer", "set decorator", "silversmith", "teacher", "auto mechanic", "beader", "bobbin boy", "clerk of the chapel", "filling station attendant", "foreman", "maintenance engineering", "mechanic", "miller", "moldmaker", "panel beater", "patternmaker", "plant operator", "plumber", "sawfiler", "shop foreman", "soaper", "stationary engineer", "wheelwright", "woodworkers"];
function generateName() {
    return firstNames[Math.floor(Math.random() * this.firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * this.lastNames.length)];
}
function calculateBorder(colour) {
    var c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
    var r = parseInt(c[1], 16) - 32 > 0 ? parseInt(c[1], 16) - 32 : 0;
    var g = parseInt(c[2], 16) - 32 > 0 ? parseInt(c[2], 16) - 32 : 0;
    var b = parseInt(c[3], 16) - 32 > 0 ? parseInt(c[3], 16) - 32 : 0;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function calculateFill(colour) {
    var c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
    var r = parseInt(c[1], 16) - 32 > 0 ? parseInt(c[1], 16) - 32 : 0;
    var g = parseInt(c[2], 16) - 32 > 0 ? parseInt(c[2], 16) - 32 : 0;
    var b = parseInt(c[3], 16) - 32 > 0 ? parseInt(c[3], 16) - 32 : 0;
    return '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
}
function generateColour() {
    var colour = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    return calculateFill(colour);
}

function get(name) {
    name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if(name)return decodeURIComponent(name[1].replace(/\+/g, ' '));
}
function onResize() {
    var PHI = (1 + Math.sqrt(5)) / 2;
    var maxWidth = $(window).width() - 150;
    var maxHeight = $(window).height() - 200;
    var width = maxHeight * PHI,
        height = maxHeight;
    if (width > maxWidth) {
        width = maxWidth;
        height = maxWidth / PHI;
    }

    $('canvas')[0].width = width;
    $('canvas')[0].height = height;

}
function randomiseColour() {
    document.getElementById('colour').value = generateColour();
}
function randomiseName() {
    document.getElementById('name').value = generateName();
}
function getValues() {
    if (get('name') !== undefined) document.getElementById('name').value = get('name');
    else randomiseName();
    if (get('colour') !== undefined) document.getElementById('colour').value = get('colour');
    else randomiseColour();
}
$(document).ready(function () {
    onResize();
    $(window).bind('resize', onResize);
    getValues();
});