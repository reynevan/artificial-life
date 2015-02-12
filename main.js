
/*
TODO
uczenie sie od kolegow
wspolne jedzenie duzych roslin
 */

(function() {
  var dist, mixColors, rnd, uni_rnd;

  jQuery(function($) {
    var Food, Organism, Predator, can, can2, canvas, canvas2, config, ctx, ctx2, i, loopx, removeDead, settings, time, _i, _j, _ref, _ref1;
    config = {
      interval: 50,
      pause: false
    };
    settings = {
      energyFromFood: 0.5,
      initPlants: ($(window).height() * $(window).width()) / 8000,
      initOrganisms: 15
    };
    canvas = document.getElementById('can');
    canvas2 = document.getElementById('can2');
    can = {
      w: $(window).width(),
      h: 800
    };
    can2 = {
      w: can.w,
      h: 600
    };
    canvas.width = can.w;
    canvas.height = can.h;
    canvas2.width = can.w;
    canvas2.height = can2.h;
    ctx = canvas.getContext('2d');
    ctx2 = canvas2.getContext('2d');
    Organism = (function() {
      Organism.id = 0;

      function Organism(genom, options) {
        this.id = Organism.id++;
        this.setGenom();
        this.setOptions(options);
        this.initialize();
        this.logic();
      }

      Organism.prototype.initialize = function() {
        this.deg = Math.random() * 2 * Math.PI;
        this.max_r = this.genom[0];
        this.r = (this.max_r / 5).nzero(1);
        this.speed = this.genom[1];
        this.friendly = this.genom[2];
        this.layers = [3, 2];
        this.brain = new NN({
          'layers': this.layers,
          'momentum': this.genom[3],
          'rate': this.genom[4]
        });
        this.fails = 0;
        this.successes = 0;
        this.energy = 15;
        this.init_t = 100;
        this.t = this.init_t;
        this.age = 0;
        this.dead = false;
        this.ignored = [];
        this.memory = 20;
        this.partner = -1;
        this.searchingPartner = false;
        this.needFood = true;
        this.reproduced = false;
        return this.reproducedTime = 0;
      };

      Organism.prototype.setOptions = function(options) {
        if (options) {
          if (options['coords']) {
            this.x = options['coords'].x;
            this.y = options['coords'].y;
          }
          if (options['color']) {
            return this.color = {
              red: options['color'].red,
              green: options['color'].green,
              blue: options['color'].blue
            };
          }
        } else {
          if (Math.random() < 0.33) {
            this.color = {
              red: 255,
              green: 0,
              blue: 0
            };
          } else if (Math.random() < 0.66) {
            this.color = {
              red: 0,
              green: 255,
              blue: 0
            };
          } else {
            this.color = {
              red: 0,
              green: 0,
              blue: 255
            };
          }
          this.x = Math.random() * (can.w + 10) - 20;
          return this.y = Math.random() * (can.h + 10) - 20;
        }
      };

      Organism.prototype.setGenom = function(genom) {
        if (!genom) {
          this.genom = [];
          this.genom[0] = Math.random() * 4 + 2;
          this.genom[1] = Math.random() * 20 + 20;
          this.genom[2] = Math.round(Math.random());
          this.genom[3] = Math.random() * 0.8;
          this.genom[4] = Math.random() * 5;
          if (Math.random() > 0.9) {
            return this.genom[2] = (++this.genom[3]) % 2;
          }
        } else {
          return this.genom = genom;
        }
      };

      Organism.prototype.logic = function() {
        if (this.deg > Math.PI * 2) {
          this.deg = this.deg - Math.PI * 2;
        } else if (this.deg < -2 * Math.PI) {
          this.deg = this.deg + Math.PI * 2;
        }
        this.t -= config.interval;
        if (this.t < 0) {
          this.energy -= (this.r / (5 * config.interval) + this.speed / (config.interval * 50)) / 5;
          this.t = this.init_t;
          this.age += (config.interval / 1000) * this.init_t / config.interval;
          this.age = this.age.round(10);
          this.r += (this.age * 0.0001) * this.max_r;
          if (this.r > this.max_r) {
            this.r = this.max_r;
          }
          if (this.energy < 0 || this.age > 300) {
            this.die();
          } else if (this.energy > 20) {
            this.needFood = false;
          } else if (this.energy < 10) {
            this.needFood = true;
          }
        }
        if (this.needFood) {
          this.searchFood();
          if (this.friendly) {
            this.stayInGroup();
          }
          this.energy -= (this.r / (5 * config.interval) + this.speed / (config.interval * 50)) / 2;
        } else {
          if (!this.reproduced) {
            this.searchPartner();
          }
        }
        if (this.reproducedTime > 0) {
          this.reproduced = true;
          return this.reproducedTime -= config.interval;
        } else {
          return this.reproduced = false;
        }
      };

      Organism.prototype.die = function() {
        this.dead = true;
        return console.log('Bleghelebe!!!!!!!!!!');
      };

      Organism.prototype.draw = function() {
        ctx.lineWidth = 1;
        this.eyes = {
          left: {
            x: this.x + Math.sin(this.deg + Math.PI / 2 - Math.PI / 5) * this.r,
            y: this.y + Math.cos(this.deg + Math.PI / 2 - Math.PI / 5) * this.r
          },
          right: {
            x: this.x - Math.sin(this.deg + Math.PI / 2 + Math.PI / 5) * this.r,
            y: this.y - Math.cos(this.deg + Math.PI / 2 + Math.PI / 5) * this.r
          }
        };
        ctx.save();
        if (this.searchingPartner) {
          ctx.shadowColor = '#f00';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.eyes.left.x, this.eyes.left.y, this.r / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.eyes.right.x, this.eyes.right.y, this.r / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgb(' + this.color.red + ',' + this.color.green + ',' + this.color.blue + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillText(this.energy.round(10), this.x, this.y - this.r - 3);
        if (this.friendly) {
          return ctx.fillText('+', this.x, this.y + 2 * this.r + 5);
        }
      };

      Organism.prototype.searchFood = function() {
        var d, decision, degToObj, i, inSight, learn, obj, _i, _ref;
        this.searchingPartner = false;
        if (Math.random() > 0.9) {
          this.deg += Math.PI * (Math.random() * 0.4 - 0.2);
        }
        inSight = [];
        for (i = _i = 0, _ref = window.objects.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          obj = window.objects[i];
          d = dist(this, obj);
          obj.d = d;
          obj.index = i;
          if (d < 100) {
            if ((obj.genom[0] === -1 && obj.r < this.r) || obj.genom[0] === 1) {
              inSight.push(obj);
            }
          }
        }
        inSight.sort(function(a, b) {
          return a.d - b.d;
        });
        if (inSight.length > 0) {
          obj = inSight[0];
          degToObj = -Math.atan2(this.x - obj.x, obj.y - this.y);
          decision = this.brain.process(obj.genom.slice(1));
          if (decision[1] < 0.8 && decision[0] > 0.5) {
            this.deg = degToObj;
          } else {
            if (Math.abs(this.deg - degToObj) < Math.Pi * 0.2) {
              this.deg += 0.3;
            }
          }
          if (obj.d < obj.r + 3) {
            learn = obj.genom[0] === -1 ? [1, 0] : [0, 1];
            this.brain.learn(obj.genom.slice(1), learn);
            window.objects.splice(obj.index, 1);
            if (obj.genom[0] === -1) {
              this.successes++;
              this.energy += obj.r * settings.energyFromFood;
              if (this.r < this.max_r) {
                this.r += obj.r / 2;
              }
            } else {
              this.fails++;
              this.energy -= 2;
              window.objects.push(new Predator());
            }
          }
        }
        return this.move();
      };

      Organism.prototype.move = function() {
        if (this.x > can.w - 10) {
          this.x = 20;
        }
        if (this.x < 10) {
          this.x = can.w - 20;
        }
        if (this.y < 10) {
          this.y = can.h - 20;
        }
        if (this.y > can.h - 10) {
          this.y = 20;
        }
        this.x += this.speed * Math.sin(this.deg) / 10;
        return this.y += this.speed * Math.cos(this.deg) / 10;
      };

      Organism.prototype.stayInGroup = function() {
        var d, deg, inSight, org, organism, _i, _j, _len, _len1, _ref;
        this.avoidPredators();
        inSight = [];
        _ref = window.organisms;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          organism = _ref[_i];
          d = dist(this, organism);
          if (d < 150 && organism.id !== this.id) {
            inSight.push(organism);
          }
        }
        deg = 0;
        for (_j = 0, _len1 = inSight.length; _j < _len1; _j++) {
          org = inSight[_j];
          deg += (-Math.atan2(this.x - org.x, org.y - this.y)) / inSight.length;
        }
        if (this.deg < deg) {
          return this.deg += 0.1;
        } else {
          return this.deg -= 0.1;
        }
      };

      Organism.prototype.avoidPredators = function() {
        var d, decision, degToObj, i, inSight, obj, _i, _ref;
        if (Math.random() > 0.9) {
          this.deg += Math.PI * (Math.random() * 0.4 - 0.2);
        }
        inSight = [];
        for (i = _i = 0, _ref = window.objects.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          obj = window.objects[i];
          d = dist(this, obj);
          obj.d = d;
          obj.index = i;
          if (d < 100) {
            inSight.push(obj);
          }
        }
        inSight.sort(function(a, b) {
          return a.d - b.d;
        });
        if (inSight.length > 0) {
          obj = inSight[0];
          while (this.ignored.indexOf(obj.id) >= 0) {
            if (inSight.length > 1) {
              inSight.splice(0, 1);
              obj = inSight[0];
            } else {
              return;
            }
          }
          degToObj = -Math.atan2(this.x - obj.x, obj.y - this.y);
          decision = this.brain.process(obj.genom.slice(1));
          if (decision[1] > 0.8) {
            if (this.ignored.indexOf(obj.id) < 0) {
              this.ignored.push(obj.id);
            }
            if (this.ignored.length > this.memory) {
              this.ignored.shift();
            }
            if (Math.abs(this.deg - degToObj) < Math.Pi * 0.2) {
              return this.deg += 0.3;
            }
          }
        }
      };

      Organism.prototype.searchPartner = function() {
        var d, inSight, move, organism, _i, _len, _ref;
        this.searchingPartner = true;
        this.avoidPredators();
        move = true;
        inSight = [];
        _ref = window.organisms;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          organism = _ref[_i];
          d = dist(this, organism);
          if (d < 300 && organism.id !== this.id && organism.searchingPartner && !organism.reproduced) {
            inSight.push(organism);
          }
        }
        inSight.sort(function(a, b) {
          return a.energy - b.energy;
        });
        if (inSight.length > 0) {
          organism = inSight[0];
          d = dist(this, organism);
          this.partner = organism.id;
          if (organism.partner === this.id) {
            this.deg = -Math.atan2(this.x - organism.x, organism.y - this.y);
            if (d < this.r + organism.r + 2) {
              this.reproduce(organism);
            }
          }
        }
        if (move) {
          return this.move();
        }
      };

      Organism.prototype.reproduce = function(organism) {
        var child, childColor, childrenNumber, gen, i, newGenom, sliceN, _i, _j, _k, _ref, _ref1;
        childrenNumber = rnd(1, 2).nzero().round(1);
        for (child = _i = 0; 0 <= childrenNumber ? _i < childrenNumber : _i > childrenNumber; child = 0 <= childrenNumber ? ++_i : --_i) {
          sliceN = Math.round(Math.random() * this.genom.length);
          newGenom = [];
          for (i = _j = 0, _ref = this.genom.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
            if (i < sliceN) {
              newGenom[i] = this.genom[i];
            } else {
              newGenom[i] = organism.genom[i];
            }
          }
          for (i = _k = 0, _ref1 = newGenom.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
            if (Math.random() > 0.9) {
              gen = newGenom[i];
              newGenom[i] += (Math.random() * gen - (gen / 2)).nzero() + 0.5;
              if (Math.random() > 0.9) {
                newGenom[i] = (Math.random() * 10 * gen - (5 * gen)).nzero() + 0.5;
              }
            }
          }

          /*is friendly when both parents are friendly
           *  when one parent is friendly and second one isn't, child has 50% to be friendly
           */
          if (this.genom[2] && organism.genom[2]) {
            newGenom[2] = 1;
          } else if ((this.genom[2] && !organism.genom[2]) || (!this.genom[2] && organism.genom[2])) {
            newGenom[2] = Math.round(Math.random());
          } else {
            newGenom[2] = 0;
          }
          childColor = mixColors(this.color, organism.color);
          window.organisms.push(new Organism(newGenom, {
            'coords': {
              x: this.x + 10,
              y: this.y + 10
            },
            'color': childColor
          }));
        }
        this.reproducedTime = 30000;
        organism.reproducedTime = 30000;
        this.searchingPartner = false;
        return organism.searchingPartner = false;
      };

      return Organism;

    })();
    Food = (function() {
      Food.id = 0;

      Food.spree = function() {
        if (Math.random() > 0.95) {
          return window.objects.push(new Food());
        }
      };

      function Food(genom, options) {
        this.id = Food.id++;
        this["class"] = 'plant';
        if (options && options['coords']) {
          this.x = options['coords'].x;
          this.y = options['coords'].y;
        } else {
          this.x = Math.random() * (can.w - 100) + 50;
          this.y = Math.random() * (can.h - 100) + 50;
        }
        if (options && options['color']) {
          this.color = {
            red: options['color'].red,
            green: options['color'].green,
            blue: options['color'].blue
          };
        } else {
          this.color = {
            red: rnd(0, 100).nzero().round(1),
            green: rnd(255, 100).nzero().round(1),
            blue: rnd(0, 10).nzero().round(1)
          };
        }
        if (options && options['r']) {
          this.max_r = options['r'];
        } else {
          this.max_r = rnd(0.5, 1.5).round(100).nzero() + 0.5;
        }
        if (options && options['age']) {
          this.age = options['age'];
        } else {
          this.age = 0;
        }
        this.genom = [-1, (this.color.red / 70).round(100), (this.color.green / 70).round(100), this.max_r * 1.5];
        this.ignore = false;
        this.init_t = 1000;
        this.t = this.init_t;
        this.reproduced = false;
        this.reproducedTime = 0;
        this.dead = false;
        this.r = (this.age / 20) * this.max_r;
      }

      Food.prototype.logic = function() {
        var children, d, i, obj, _i, _j, _ref;
        this.neighbours = 0;
        this.t -= config.interval;
        if (this.t < 0) {
          this.t = this.init_t;
          this.age += (config.interval / 1000) * this.init_t / config.interval;
          this.age = this.age.round(10);
          for (i = _i = 0, _ref = window.objects.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            obj = window.objects[i];
            if (obj["class"] === 'plant') {
              d = dist(this, obj);
              if (d < 30) {
                this.neighbours++;
              }
            }
          }
          if (this.age > Math.random() * 10 + 5 && !this.reproduced && this.neighbours < 4) {
            children = (Math.random() * 5).round(1);
            for (i = _j = 0; 0 <= children ? _j < children : _j > children; i = 0 <= children ? ++_j : --_j) {
              this.reproduce();
            }
          }
          this.r = (this.age / 20) * this.max_r;
          if (this.r > this.max_r) {
            this.r = this.max_r;
          }
          if (this.reproducedTime > 0) {
            this.reproducedTime -= this.init_t;
            this.reproduced = true;
          } else {
            this.reproducedTime = 0;
            this.reproduced = false;
          }
          if (this.age > 80) {
            this.dead = true;
            return console.log('pssssstrzczc');
          }
        }
      };

      Food.prototype.reproduce = function() {
        var coords, i, newColor, newColors, newR, _i;
        newColors = [this.color.red, this.color.green, this.color.blue];
        for (i = _i = 0; _i < 3; i = ++_i) {
          if (Math.random() > 0.9) {
            newColors[i] += rnd(0, 20).round(1);
            newColors[i].nzero();
          }
        }
        newColor = {
          red: newColors[0],
          green: newColors[1],
          blue: newColors[2]
        };
        coords = {
          x: (Math.random() > 0.5 ? this.x + Math.random() * 15 + this.r : this.x - Math.random() * 15 - this.r).round(1),
          y: (Math.random() > 0.5 ? this.y + Math.random() * 15 + this.r : this.y - Math.random() * 15 - this.r).round(1)
        };
        if (coords.x > 10 && coords.x < can.w - 10 && coords.y > 10 && coords.y < can.h - 10) {
          newR = (this.r + rnd(0, 1)).nzero(0.5);
          window.objects.push(new Food(null, {
            'coords': coords,
            'color': newColor,
            'r': newR
          }));
          return this.reproducedTime = Math.random() * 20000 + 10000;
        }
      };

      Food.prototype.draw = function() {
        ctx.save();
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.fillStyle = 'rgb(' + this.color.red + ',' + this.color.green + ',' + this.color.blue + ')';
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        return ctx.restore();
      };

      return Food;

    })();
    Predator = (function() {
      Predator.id = 0;

      function Predator() {
        this["class"] = 'predator';
        this.id = Predator.id++;
        this.x = Math.random() * (can.w - 100) + 50;
        this.y = Math.random() * (can.h - 100) + 50;
        this.seed = Math.random();
        this.r = (this.seed + 4).round(100);
        this.red = rnd(255, 100).nzero().round(1);
        this.green = rnd(0, 100).nzero().round(1);
        this.color = 'rgb(' + this.red + ',' + this.green + ',0)';
        this.color;
        this.genom = [1, (this.red / 70).round(100), (this.green / 70).round(100), this.r * 1.5];
        this.ignore = false;
        this.memory = 0;
        this.dead = false;
      }

      Predator.prototype.logic = function() {};

      Predator.prototype.draw = function() {
        if (this.memory > 1000) {
          this.memory = 0;
          this.ignore = false;
        }
        ctx.save();
        ctx.beginPath();
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 2;
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        return ctx.restore();
      };

      return Predator;

    })();
    window.objects = [];
    window.organisms = [];
    for (i = _i = 0, _ref = settings.initOrganisms; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      window.organisms.push(new Organism());
    }
    for (i = _j = 0, _ref1 = Math.round(settings.initPlants); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      window.objects.push(new Food(null, {
        'age': (Math.random() * 5 + 15).round(1)
      }));
      if (i % 4 === 0) {
        window.objects.push(new Predator());
      }
    }
    window.foods = 0;
    time = 1000;
    window.i = 0;
    window.f0 = 0;
    window.f = window.foods;
    window.o = window.objects.length;
    window.o0 = 0;
    removeDead = function() {
      var obj, organism, _k, _l, _ref2, _ref3, _results;
      for (i = _k = 0, _ref2 = window.organisms.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
        organism = window.organisms[i];
        if (organism.dead) {
          window.organisms.splice(i, 1);
          removeDead();
          break;
        }
      }
      window.foods = 0;
      _results = [];
      for (i = _l = 0, _ref3 = window.objects.length; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; i = 0 <= _ref3 ? ++_l : --_l) {
        obj = window.objects[i];
        if (obj["class"] === 'plant') {
          window.foods++;
        }
        if (obj.dead) {
          window.objects.splice(i, 1);
          removeDead();
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    loopx = function() {
      var obj, organism, _k, _l, _len, _ref2, _ref3;
      if (!config.pause) {
        if (window.organisms.length <= 0) {
          config.pause = true;
          ctx.fillText("THE END", can.w / 2, can.h / 2);
        }
        ctx.clearRect(0, 0, can.w, can.h);
        for (i = _k = 0, _ref2 = window.organisms.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
          organism = window.organisms[i];
          organism.logic();
          organism.draw();
        }
        _ref3 = window.objects;
        for (_l = 0, _len = _ref3.length; _l < _len; _l++) {
          obj = _ref3[_l];
          obj.logic();
          obj.draw();
        }
        Food.spree();
        time -= config.interval;
        if (time < 0) {
          removeDead();
          time = 1000;
          ctx2.save();
          ctx2.clearRect(window.i, 0, 10, can2.h);
          ctx2.strokeStyle = '#f00';
          ctx2.beginPath();
          ctx2.moveTo(window.i, (can2.h - (window.f0 * 0.5)).nzero(5));
          ctx2.lineTo(window.i + 1, (can2.h - (window.f * 0.5)).nzero(5));
          window.f0 = window.f;
          window.f = window.foods;
          ctx2.stroke();
          ctx2.beginPath();
          ctx2.strokeStyle = '#0f0';
          ctx2.moveTo(window.i, (can2.h - (window.o0 * 5)).nzero(5), 1, 1);
          ctx2.lineTo(window.i + 1, (can2.h - (window.o * 5)).nzero(5), 1, 1);
          window.o0 = window.o;
          window.o = window.organisms.length;
          ctx2.stroke();
          ctx2.restore();
          window.i++;
          if (window.i > can2.w) {
            return window.i = 0;
          }
        }
      }
    };
    setInterval((function() {
      return loopx();
    }), config.interval);

    /*
    randoms = []
    for i in [-50..200]
      randoms[i] = 0
    for i in [0..10000]
      index = rnd(100,20)
      randoms[index]++
    for i in [-50..200]
      ctx.rect i*3, 500, 2, -randoms[i]
      ctx.fill()
      console.log randoms[i]
     */
    $(document).on('keydown', function(event) {
      if (event.keyCode === 80) {
        config.pause = !config.pause;
      }
      if (event.keyCode === 81) {
        return console.log(window.objects);
      }
    });
    return $('#can').on('click', function(event) {
      var click, closest, closest_org, d, org, _k, _len, _ref2;
      click = {
        x: event.pageX,
        y: event.pageY
      };
      closest = 9999;
      _ref2 = window.organisms;
      for (_k = 0, _len = _ref2.length; _k < _len; _k++) {
        org = _ref2[_k];
        d = dist(click, org);
        if (d < closest) {
          closest = d;
          closest_org = org;
        }
      }
      return console.log(closest_org);
    });
  });

  dist = function(obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
  };

  uni_rnd = function() {
    return Math.random() * 2 - 1;
  };

  rnd = function(mean, dev) {
    return (uni_rnd() + uni_rnd() + uni_rnd()) * dev + mean;
  };

  Number.prototype.nzero = function(min) {
    min = !min ? 0 : min;
    if (this.valueOf() < 0) {
      return min;
    } else {
      return this.valueOf();
    }
  };

  Number.prototype.round = function(n) {
    return Math.round(this.valueOf() * n) / n;
  };

  mixColors = function(color1, color2) {
    var childColor, i, newColor, _i;
    newColor = [];
    newColor[0] = (color1.red + color2.red) / 2;
    newColor[1] = (color1.green + color2.green) / 2;
    newColor[2] = (color1.blue + color2.blue) / 2;
    for (i = _i = 0; _i <= 2; i = ++_i) {
      if (Math.random() > 0.9) {
        newColor[i] += rnd(122, 122).round(1);
      }
    }
    return childColor = {
      red: newColor[0].round(1),
      green: newColor[1].round(1),
      blue: newColor[2].round(1)
    };
  };

}).call(this);
