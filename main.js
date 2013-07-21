var Game = function() {
    this.cup_width = 106;
    this.set_div = function(div) {
        this.div = div;
    }

    this.set_cups = function(cups) {
        this.cups = [];
        this.div.html('');
        for (var i = 0; i < cups; i++) {
            var cup = new Cup();
            cup.create_element(i);
            this.div.append(cup.elem);
            this.cups.push(cup);
        }
        this.align_cups();
    }

    this.set_level = function(level) {
        this.level = level;
    }

    this.align_cups = function() {
        var total_width = this.cup_width * this.cups.length,
            div_center = this.div.width() / 2,
            start_pos = div_center - (total_width / 2);
        for (var i = 0; i < this.cups.length; i++) {
            this.cups[i].set_pos(start_pos + (i * this.cup_width));
        }
    }

    this.start = function(callback) {
        // Difficult level changes 3 things:
        // The time the cup takes to move from one position to another = 1000(ms) / difficult
        // The ammount of moves = 3 + (difficult * 2)
        var instance = this;
        var cup = Math.floor(Math.random()*this.cups.length);
        this.cups[cup].set_ball(true);
        this.cups[cup].show_content(function() {
                instance.switch_cups((1000 / instance.level), (3 + (instance.level * 2)), function() {
                    instance.choose_cup(function(choosen_cup) {
                        callback(cup, choosen_cup);
                    });
                });
        });
    }

    this.switch_cups = function(move_time, rec, recfinish_callback, cup1, cup2) {
        if (typeof cup1 === 'undefined' || typeof cup2 === 'undefined') {
            cup1 = Math.floor(Math.random()*this.cups.length);
            while (true) {
                cup2 = Math.floor(Math.random()*this.cups.length);
                if (cup1 != cup2) break;
            }
        }
        var instance = this;

        // Make sure no cups are moving
        // (Javascript can take a few ms longer to complete the animations
        // and if we don't check everthing will explode.)
        // If the animation is not over, we give it 5ms and try again
        if (this.cups[cup1].is_moving == false && this.cups[cup2].is_moving == false) {
            var cup1_pos = this.cups[cup1].elem.css('left').replace(/[^-\d\.]/g, ''),
                cup2_pos = this.cups[cup2].elem.css('left').replace(/[^-\d\.]/g, '');
            console.log('Switching cup ' + cup1 + ' with cup ' + cup2);
            this.cups[cup1].move_cup(cup2_pos, move_time, 1);
            this.cups[cup2].move_cup(cup1_pos, move_time, -1);

            if (rec > 1) {
                setTimeout(function(){ 
                    instance.switch_cups(move_time, rec-1, function() {
                        recfinish_callback();
                    })
                }, move_time);
            } else {
                setTimeout(function(){recfinish_callback();}, move_time);
            }

        //Animation not over
        } else {
            console.log('Animation not over. Delaying 5 ms');
            setTimeout(function(){ 
                instance.switch_cups(move_time, rec, function() {
                    recfinish_callback();
                })
            }, 5, cup1, cup2);
        }
    }

    this.choose_cup = function(callback, cup) {
        $('.cup').css('cursor', 'pointer');
        $('.cup').bind('click', function () {
            $('.cup').unbind('click');
            $('.cup').css('cursor', 'auto');
            callback($(this).attr('data-id'));
        });
    }
}

var Cup = function() {
    this.ball = false;
    this.is_moving = false;
    this.move_cup = function(new_pos, move_time, zindex) {
        var instance = this;
        var current_left = parseFloat(this.elem.css('left').replace(/[^-\d\.]/g, '')),
            current_top = parseFloat(this.elem.css('top').replace(/[^-\d\.]/g, '')),
            dir = (current_left > parseFloat(new_pos)) ? -1 : 1,
            diff = (current_left > new_pos) ? current_left - new_pos : new_pos - current_left,
            width = this.elem.width(),
            depth_pixels = 20;

        this.elem.css('z-index', zindex+4);

        this.is_moving = true;
        // Creating depth
        this.elem.animate({'left': current_left + (parseFloat(width / 2) * dir),
                           'top': (zindex > 0) ? current_top + parseFloat(depth_pixels) : current_top - depth_pixels }
        , ((move_time * (width/2)) / diff), 'linear', function() {
        // Moving to new position
            instance.elem.animate({'left': current_left + ((diff - (width / 2))*dir)}
            , ((move_time * (diff-width)) / diff), 'linear', function() {
        // Removing depth
                instance.elem.animate({'left': new_pos,
                                       'top': current_top}
                , ((move_time * (width/2)) / diff), 'linear', function() {
        // Taking off z-index
                    instance.elem.css('z-index', 4);
                    instance.is_moving = false;
                })
            });
        });
    }

    this.create_element = function(id) {
        this.elem = $('<div class="cup" data-id="' + id + '"></div>')
            .append($('<img src="copo.png" />'));
        this.elem.css('top', 75);
    }

    this.set_pos = function(left_pixel) {
        this.elem.css('left', left_pixel);
    }
    this.show_content = function(callback) {
        if (this.ball)
            this.create_ball();

        var current_top = this.elem.css('top').replace(/[^-\d\.]/g, ''),
            instance = this;
        this.elem.animate({
            'top': current_top - 50
        }, 500, function() {
            setTimeout(function() {
                instance.elem.animate({'top': current_top}, 500, function() { if(instance.ball) instance.remove_ball(); callback(); }); 
            }, 500);
        }); 
    }
    this.set_ball = function(ball) {
        if (ball === true)
            this.ball = true;
        else
            this.ball = false;
    }

    this.create_ball = function() {
            this.ball_elem = $('<div class="ball"></div>');
            this.elem.after(this.ball_elem);
            var ball_left = parseInt(this.elem.css('left').replace(/[^-\d\.]/g, ''))
                            + (this.elem.width() / 2)
                            - (this.ball_elem.width() / 2),
                ball_top = parseInt(this.elem.css('top').replace(/[^-\d\.]/g, ''))
                           + (this.elem.height())
                           - (this.ball_elem.height())
                           - 10;
            this.ball_elem.css({'left': ball_left,
                      'top': ball_top,
                      'z-index': 3});
    }

    this.remove_ball = function() {
        this.ball_elem.remove();
    }
}

var game;
$(document).ready(function() {
    game = new Game();
    game.set_div($('#game'));
    game.set_cups(3);
    resize_bg();

    $('#play').click(function() {
        game.set_level($('#level').val());
        $(this).prop('disabled', true);
        var bt = $(this);

        game.start(function(right_cup, choosen_cup) {
            if (right_cup == choosen_cup) {
                game.cups[right_cup].show_content(function() {
                    bt.prop('disabled', false);
                    game.cups[right_cup].set_ball(false);
                });
            } else {
                game.cups[choosen_cup].show_content(function() {
                    game.cups[right_cup].show_content(function() {
                        bt.prop('disabled', false);
                        game.cups[right_cup].set_ball(false);
                    });
                });
            }
        });
    });

    $(window).resize(function() { resize_bg(); });
});



///
function resize_bg() {
    $('#bg').width($(window).width());
    $('#bg').height($(window).height());
    $('#bg > img').width($(window).width());
    $('#bg > img').height($(window).height());
    $('#game').width($(window).width());
    game.align_cups();
}