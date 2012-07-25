/**
 *  * HistoryMover plug-in for JQuery, allows you use HTML 5 History API.
 *  * If the browser supports it, is set to the request header 
 *  * to distinguish the request to the server.
 *  * For older browsers request fulfills the classical way.
 *  * Copyright (c) Sergei Istergul Munzhulov <istergul@gmail.com>
 *  * Licensed like jQuery, see http://docs.jquery.com/License.
*/

(function($){

function checkSupportHistory() {
    return !!(window.history && history.pushState && window.history.replaceState);
}

$.fn.historyMover = function(options) {
    if (!checkSupportHistory()) {
        return; 
    } else {
        return this.live('click', function(event){
            $.historyMover.node = this;
            $.historyMover.moveExtCallbacks(options);
            $.historyMover.build(this.href, options);
            event.preventDefault();
        });
    }
}

$.historyMover = {
    request: null,
    active: false,
    node: null,
    beforeExt: $.noop,
    successExt: $.noop,
    errorExt: $.noop,
    completeExt: $.noop,
    moveExtCallbacks: function(options) {
        if (options.before) {
            this.beforeExt = options.before;
            delete options.before;
        }
        if (options.success) {
            this.successExt = options.success;
            delete options.success;
        }
        if (options.error) {
            this.errorExt = options.error;
            delete options.error;
        }
        if (options.complete) {
            this.completeExt = options.complete;
            delete options.complete;
        }
    },
    build: function(url, options) {
        var defaults = {
            type: "GET",
            push: true,
            replace: false,
            timeout: 650,
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-HISTORY', 'true');
                $.historyMover.beforeExt.apply($.historyMover.node, arguments);
            },
            success: function(data) {
                $(options.container).html(data.response);

                var oldTitle = document.title;
                if (data.title) document.title = data.title;
                var state = {
                    container: options.container,
                    timeout: options.timeout
                }

                if (options.replace) {
                    window.history.replaceState(state, document.title, url);
                } else if (options.push) {
                    // this extra replaceState before first push ensures good back button behavior
                    if (!$.historyMover.active) {
                        window.history.replaceState($.extend({}, state, {url:null}), oldTitle);
                        $.historyMover.active = true;
                    }
                    window.history.pushState(state, document.title, url);
                }

                // If the URL has a hash in it, make sure the browser knows to navigate to the hash.
                var hash = window.location.hash.toString();
                if (hash !== '') { window.location.href = hash; }

                currentURL = location.href;
                // Invoke their success handler if they gave us one.
                $.historyMover.successExt.apply($.historyMover.node, arguments);

            },
            error: function(xhr, textStatus, errorThrown) {
                //console.log(arguments);
                $.historyMover.errorExt.apply($.historyMover.node, arguments);
                //window.location = url;
            },
            complete: function() {
                $.historyMover.completeExt.apply($.historyMover.node, arguments);
            }
        };

        options = $.extend(true, {}, defaults, options);

        var xhr = this.request;
        if (xhr && xhr.readyState < 4) { xhr.onreadystatechange = $.noop; xhr.abort(); }
        this.request = $.ajax(options);
        return $.historyMover.request;
    }
}

if ($.inArray('state', $.event.props) < 0) $.event.props.push('state');
var poppedState = false,
    initialURL = location.href,
    currentURL = location.href;


$(window).bind("popstate", function(event) {
    // Ignore inital popstate that some browsers fire on page load
    if (!poppedState && currentURL == initialURL) return;
    poppedState = true;
    var state = event.state;
    if (state && state.container) {
        if ($(state.container).length) {
            $.historyMover.build(state.url || location.href, {
                container: state.container,
                push: false,
                timeout: state.timeout
            });
        } else { window.location = location.href; }
    }
});

})(jQuery);
