console.clear();

let $ = {};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| UTILITY
           |=|________________________________/
*/

$.PI = Math.PI;
$.TAU = $.PI * 2;

$.rand = (min, max) => {
    return Math.random() * (max - min) + min;
};

$.hsla = (h, s, l, a) => {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
};

$.baseRange = (base, range) => {
    return base + $.rand(-range, range);
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| POOL
           |=|________________________________/
*/

$.Pool = class {
    constructor(base, preallocateAmount) {
        this.base = base;
        this.preallocateAmount = preallocateAmount || 0;
        this.alive = [];
        this.dead = [];
        this.length = 0;
        this.deadLength = 0;
        if (this.preallocateAmount) {
            this.preallocate();
        }
    }
    preallocate() {
        for (var i = 0; i < this.preallocateAmount; i++) {
            this.dead.push(new this.base());
            this.deadLength++;
        }
    }
    create(opt) {
        if (this.deadLength) {
            var obj = this.dead.pop();
            obj.init(opt);
            this.alive.push(obj);
            this.deadLength--;
            this.length++;
            return obj;
        } else {
            var newItem = new this.base();
            newItem.init(opt);
            this.alive.push(newItem);
            this.length++;
            return newItem;
        }
    }
    release(obj) {
        var i = this.alive.indexOf(obj);
        if (i > -1) {
            this.dead.push(this.alive.splice(i, 1)[0]);
            this.length--;
            this.deadLength++;
        }
    }
    empty() {
        this.alive.length = 0;
        this.dead.length = 0;
        this.length = 0;
        this.deadLength = 0;
    }
    each(action, asc) {
        var i = this.length;
        while (i--) {
            this.alive[i][action](i);
        }
    }
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| PARTICLE
           |=|________________________________/
*/

$.Particle = class {
    constructor() {}
    init(opt) {
        Object.assign(this, opt);
        this.life = 1;
    }
    step() {
        this.velocity += this.acceleration;
        this.angle += $.rand(-this.wander, this.wander);
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
        this.life -= this.decay;
        this.alpha = this.fade ? (this.life * 1.5) : 1;
        if (this.life < 0) {
            this.parent.particles.release(this);
        }
    }
    draw() {
        $.ctx.beginPath();
        $.ctx.arc(this.x, this.y, this.radius, 0, $.TAU);
        $.ctx.fillStyle = $.hsla(this.hue, this.saturation, this.lightness, this.alpha);
        $.ctx.fill();
    }
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| PARTICLE EMITTER
           |=|________________________________/
*/

$.ParticleEmitter = class {
    constructor(opt) {
        Object.assign(this, opt);
        this.particles = new $.Pool($.Particle, 100);
    }
    step() {
        if ($.tick % this.interval === 0) {
            this.particles.create({
                parent: this,
                x: $.baseRange(this.x.base, this.x.range),
                y: $.baseRange(this.y.base, this.y.range),
                radius: $.baseRange(this.radius.base, this.radius.range),
                angle: $.baseRange(this.angle.base, this.angle.range),
                velocity: $.baseRange(this.velocity.base, this.velocity.range),
                acceleration: $.baseRange(this.acceleration.base, this.acceleration.range),
                decay: $.baseRange(this.decay.base, this.decay.range),
                hue: $.baseRange(this.hue.base, this.hue.range),
                saturation: $.baseRange(this.saturation.base, this.saturation.range),
                lightness: $.baseRange(this.lightness.base, this.lightness.range),
                wander: this.wander,
                fade: this.fade,
            });
        }
        this.particles.each('step');
    }
    draw() {
        $.ctx.globalCompositeOperation = this.blend;
        this.particles.each('draw');
    }
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| INIT
           |=|________________________________/
*/

$.init = () => {
    $.c = document.querySelector('canvas')
    $.ctx = $.c.getContext('2d');
    $.w = $.c.width = 400;
    $.h = $.c.height = 400;
    $.particleEmitters = [];
    $.tick = 1;

    // Spark Emitter
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w * 0.5,
            range: 20
        },
        y: {
            base: $.h,
            range: 20
        },
        radius: {
            base: 0.75,
            range: 0.4
        },
        angle: {
            base: -$.PI * 0.5,
            range: $.PI * 0.01
        },
        velocity: {
            base: 0.5,
            range: 0.5
        },
        acceleration: {
            base: 0.01,
            range: 0.01
        },
        decay: {
            base: 0.005,
            range: 0.001
        },
        hue: {
            base: 30,
            range: 30
        },
        saturation: {
            base: 80,
            range: 20
        },
        lightness: {
            base: 80,
            range: 20
        },
        wander: 0.06,
        blend: 'lighter',
        fade: true,
        interval: 5
    }));

    // Negative Emitter 1
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w - 100,
            range: 25
        },
        y: {
            base: $.h,
            range: 5
        },
        radius: {
            base: 20,
            range: 10
        },
        angle: {
            base: -$.PI * 0.55,
            range: $.PI * 0.05
        },
        velocity: {
            base: 2,
            range: 0
        },
        acceleration: {
            base: 0.02,
            range: 0.01
        },
        decay: {
            base: 0.001,
            range: 0
        },
        hue: {
            base: 0,
            range: 0
        },
        saturation: {
            base: 0,
            range: 0
        },
        lightness: {
            base: 0,
            range: 0
        },
        wander: 0.05,
        blend: 'destination-out',
        fade: false,
        interval: 1
    }));

    // Negative Emitter 2
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: 100,
            range: 25
        },
        y: {
            base: $.h,
            range: 5
        },
        radius: {
            base: 20,
            range: 10
        },
        angle: {
            base: -$.PI * 0.45,
            range: $.PI * 0.05
        },
        velocity: {
            base: 2,
            range: 0
        },
        acceleration: {
            base: 0.02,
            range: 0.01
        },
        decay: {
            base: 0.001,
            range: 0
        },
        hue: {
            base: 0,
            range: 0
        },
        saturation: {
            base: 0,
            range: 0
        },
        lightness: {
            base: 0,
            range: 0
        },
        wander: 0.05,
        blend: 'destination-out',
        fade: false,
        interval: 1
    }));

    // Yellow Emitter
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w * 0.5,
            range: 20
        },
        y: {
            base: $.h,
            range: 20
        },
        radius: {
            base: 15,
            range: 5
        },
        angle: {
            base: -$.PI * 0.5,
            range: $.PI * 0.05
        },
        velocity: {
            base: 1.5,
            range: 0
        },
        acceleration: {
            base: 0.02,
            range: 0.01
        },
        decay: {
            base: 0.0075,
            range: 0
        },
        hue: {
            base: 60,
            range: 0
        },
        saturation: {
            base: 100,
            range: 0
        },
        lightness: {
            base: 70,
            range: 0
        },
        wander: 0.01,
        blend: 'source-over',
        fade: false,
        interval: 2
    }));

    // White Emitter
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w * 0.5,
            range: 20
        },
        y: {
            base: $.h - 20,
            range: 20
        },
        radius: {
            base: 2,
            range: 1
        },
        angle: {
            base: -$.PI * 0.5,
            range: $.PI * 0.001
        },
        velocity: {
            base: 0.5,
            range: 0
        },
        acceleration: {
            base: 0.02,
            range: 0.02
        },
        decay: {
            base: 0.0075,
            range: 0
        },
        hue: {
            base: 60,
            range: 0
        },
        saturation: {
            base: 90,
            range: 0
        },
        lightness: {
            base: 100,
            range: 0
        },
        wander: 0.025,
        blend: 'source-over',
        fade: false,
        interval: 3
    }));

    // Orange Emitter
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w * 0.5,
            range: 20
        },
        y: {
            base: $.h - 20,
            range: 15
        },
        radius: {
            base: 25,
            range: 5
        },
        angle: {
            base: -$.PI * 0.5,
            range: $.PI * 0.025
        },
        velocity: {
            base: 2,
            range: 0.25
        },
        acceleration: {
            base: 0.01,
            range: 0.01
        },
        decay: {
            base: 0.0075,
            range: 0
        },
        hue: {
            base: 30,
            range: 0
        },
        saturation: {
            base: 90,
            range: 0
        },
        lightness: {
            base: 50,
            range: 0
        },
        wander: 0.01,
        blend: 'source-over',
        fade: false,
        interval: 2
    }));

    // Red Emitter
    $.particleEmitters.push(new $.ParticleEmitter({
        x: {
            base: $.w * 0.5,
            range: 30
        },
        y: {
            base: $.h - 20,
            range: 15
        },
        radius: {
            base: 35,
            range: 10
        },
        angle: {
            base: -$.PI * 0.5,
            range: $.PI * 0.025
        },
        velocity: {
            base: 2,
            range: 0.25
        },
        acceleration: {
            base: 0.01,
            range: 0.01
        },
        decay: {
            base: 0.0075,
            range: 0
        },
        hue: {
            base: 0,
            range: 0
        },
        saturation: {
            base: 90,
            range: 0
        },
        lightness: {
            base: 50,
            range: 0
        },
        wander: 0.01,
        blend: 'source-over',
        fade: false,
        interval: 2
    }));

    $.gradient = $.ctx.createLinearGradient(0, 0, 0, $.h * 0.75);
    $.gradient.addColorStop(0, $.hsla(0, 0, 0, 1));
    $.gradient.addColorStop(1, $.hsla(0, 0, 0, 0));

    $.loop();
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| STEP
           |=|________________________________/
*/

$.step = () => {
    let i = $.particleEmitters.length;
    while (i--) {
        $.particleEmitters[i].step();
    }
    $.tick++;
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| DRAW
           |=|________________________________/
*/

$.draw = () => {
    $.ctx.clearRect(0, 0, $.w, $.h);
    let i = $.particleEmitters.length;
    while (i--) {
        $.particleEmitters[i].draw();
    }

    $.ctx.globalCompositeOperation = 'destination-out';
    $.ctx.fillStyle = $.gradient;
    $.ctx.fillRect(0, 0, $.w, $.h);

    $.ctx.beginPath();
    $.ctx.globalCompositeOperation = 'source-over';
    $.ctx.arc($.w * 0.5, $.h + 40, 63, 0, $.TAU);
    $.ctx.fillStyle = '#f00';
    $.ctx.fill();

    $.ctx.beginPath();
    $.ctx.globalCompositeOperation = 'source-over';
    $.ctx.arc($.w * 0.5, $.h + 40, 60, 0, $.TAU);
    $.ctx.fillStyle = '#000';
    $.ctx.fill();
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| LOOP
           |=|________________________________/
*/

$.loop = () => {
    requestAnimationFrame($.loop);
    $.step();
    $.draw();
};

/*
           |=|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/
[::{}{}{}{}|=| TO BATTLE!
           |=|________________________________/
*/

$.init();