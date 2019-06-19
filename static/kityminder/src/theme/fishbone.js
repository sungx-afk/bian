define(function(require, exports, module) {
    var theme = require('../core/theme');
    function hsl(h, s, l) {
        return kity.Color.createHSL(h, s, l);
    }
    theme.register('fishbone', {
        'background': '#fbfbfb',

            'root-color': 'white',
            'root-background': '#73cdfb',
            'root-stroke': '#73cdfb',
            'root-font-size': 16,
            'root-padding': [12, 24],
            'root-margin': [30, 100],
            'root-radius': 5,
            'root-space': 10,

            'main-color': '#333333',
            'main-background': '#fafafa',
            'main-stroke': '#73cdfb',
            'main-stroke-width': 1,
            'main-font-size': 14,
            'main-padding': [6, 20],
            'main-margin': 20,
            'main-radius': 3,
            'main-space': 5,

            'sub-color': '#333333',
            'sub-background': 'transparent',
            'sub-stroke': 'none',
            'sub-font-size': 12,
            'sub-padding': [5, 10],
            'sub-margin': [15, 20],
            'sub-radius': 5,
            'sub-space': 5,

            'connect-color': '#86a2d5',
            'connect-width': 1,
            'connect-radius': 5,

            'selected-stroke': '#60c8fe',
            'selected-background': '#e4f4fc',
            'selected-color': '#333333',
            'selected-stroke-width': '3',
            'blur-selected-stroke': hsl(204, 10, 60),

            'marquee-background': hsl(204, 100, 80).set('a', 0.1),
            'marquee-stroke': hsl(204, 37, 60),

            'drop-hint-color': hsl(204, 26, 35),
            'drop-hint-width': 5,

            'order-hint-area-color': hsl(204, 100, 30).set('a', 0.5),
            'order-hint-path-color': hsl(204, 100, 25),
            'order-hint-path-width': 1,

            'text-selection-color': hsl(204, 100, 20),
            'line-height':1.5
    });
});