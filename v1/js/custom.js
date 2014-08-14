var isPhablet = false,
    bookCfg;

if (window.lowIE) {
    // Browser is lower than IE9
} else {
    window.lowIE = false;
}
       
$(document).ready(function() {
    
    // Detect most common Tablets and Phones otherwise treat as standard web browser
    if (/iPad|iPhone/i.test(navigator.userAgent) ||                     /* iPad or iPhone */
        /(?:Silk|Kindle|KFOT|FKTT|KFJW)/.test(navigator.userAgent) ||   /* Kindle Fire */
        /NOOK/.test(navigator.userAgent) ||                             /* Nook */
        /Android/.test(navigator.userAgent)                             /* Android */
       ) { isPhablet = true; }
    
    
    // Shim for IE9 to allow console.log
    if (!window.console) (function() {
        var __console, Console;
    
        Console = function() {
            var check = setInterval(function() {
                var f;
                if (window.console && console.log && !console.__buffer) {
                    clearInterval(check);
                    f = (Function.prototype.bind) ? Function.prototype.bind.call(console.log, console) : console.log;
                    for (var i = 0; i < __console.__buffer.length; i++) f.apply(console, __console.__buffer[i]);
                }
            }, 1000); 
    
            function log() {
                this.__buffer.push(arguments);
            }
    
            this.log = log;
            this.error = log;
            this.warn = log;
            this.info = log;
            this.__buffer = [];
        };
    
        __console = window.console = new Console();
    })();
    
    //variables to confirm window height and width
    var lastWindowHeight = $(window).height();
    var lastWindowWidth = $(window).width();

    $(window).resize(function() {

        //confirm window was actually resized
        if($(window).height()!=lastWindowHeight || $(window).width()!=lastWindowWidth){

            //set this windows size
            lastWindowHeight = $(window).height();
            lastWindowWidth = $(window).width();

            //refresh page
            window.setTimeout(refreshPage, 2000);
        }
    });
    
    $.ajax({
        url: filename,
        contentType: 'application/json',
        dataType: 'json',
        success: function(data, responseText) {
            var pageArray = new Array(), html;
            
            bookCfg = data;
            
            console.log(filename + "\n" + responseText);
            
            $.each(bookCfg.bookPages[0], function(i, item){
                pageArray.push(item);
            });
            
            //Create pages using images specified in JSON
            createPages(bookCfg.bookPageFolder, pageArray);
            
            if (!isPhablet && bookCfg.enableDragging) {
                //Need to insert drag text in a place other than Zoom - if zoom is disabled, text will not appear
                $dragText = $("<p></p>");
                $dragText
                    .attr({
                        'id' : 'drag-text'
                    })
                    .html(bookCfg.dragBookletText);
                    
                $("header").append($dragText);
                bindDrag();
            }
            
            drawZoom();
            
            if (isPhablet || !bookCfg.enableZoom || window.lowIE) {
                $("#zoom").hide();
            }
            
            html = ''.concat();
            $("#brand").hide();
            
            if (bookCfg.showBrandName) {
                html = html.concat(bookCfg.brandName);
                
                if (bookCfg.showMagazineTitle) {
                    html = html.concat(" : " + bookCfg.magazineTitle);
                }
                
                $("#brand").html(html).show();
            } else {
                if (bookCfg.showMagazineTitle) {
                    html = html.concat(bookCfg.magazineTitle);
                    $("#brand").html(html).show();
                }
            }
            
            if (bookCfg.enableSubscribeButton) {
                $subButton = $("<a></a>");
                $subButton
                    .attr({
                        'href' : bookCfg.subscribeButtonUrl,
                        'id' : 'subscribe'
                    })
                    .html(bookCfg.subscribeButtonText);
                    
                $("header").append($subButton);
            }

            drawBooklet();
                
            $("#mybook").ready(function() {
                // Refresh page on initial load (fixes any broken images if not cached)
                if (!window.location.hash) {
                    setTimeout(function() {
                        window.location = window.location + '#loaded';
                        window.location.reload();
                    }, 1000);
                }
            });
        },
        error: function(data) {
            console.log(filename + "\n" + data.statusText + "\n" + data.status);
        }
    });

    
            
    function drawZoom() {
        var html, $zoom, $zoomIn, $zoomOut;
        
        $zoom = $("<ul></ul>");
        $zoom.attr('id','zoom');
        
        $zoomIn = $("<li></li>");
        html = ''.concat(
            "<img src='../../../images/spacer.gif' class='zoom-in left' width='1' height='1' align='left' border='0'/>",
            "<span class='text'>" + bookCfg.zoomInText + "</span>",
            "<img src='../../../images/spacer.gif' class='zoom-in right' width='1' height='1' align='right' border='0'/>"
        );
        
        $zoomIn.attr('id','zoomIn')
            .html(html)
            .bind("click", function() {
                $(this).hide();
                $("#zoomOut").show();
                $("#mybook").css({
                    '-webkit-transform': 'scale(' + bookCfg.zoomLevel + ')',
                    '-webkit-transition': 'all .5s linear',
                    '-webkit-transform-style': 'preserve-3d',
                    '-moz-transform': 'scale(' + bookCfg.zoomLevel + ')',
                    '-moz-transition': 'transform 0.5s linear 0s',
                    '-transform': 'scale(' + bookCfg.zoomLevel + ')',
                    'transition': 'all .5s linear'
                });
            });
        $zoom.append($zoomIn);
        
        $zoomOut = $("<li></li>");
        html = ''.concat(
            "<img src='../../../images/spacer.gif' class='zoom-out left' width='1' height='1' align='left' border='0'/>",
            "<span class='text'>" + bookCfg.zoomOutText + "</span>",
            "<img src='../../../images/spacer.gif' class='zoom-out right' width='1' height='1' align='right' border='0'/>"
        );
        
        $zoomOut.attr('id','zoomOut')
            .html(html)
            .bind("click", function() {
                $(this).hide();
                $("#zoomIn").show();
                $("#mybook").css({
                    '-webkit-transform': 'scale(1)',
                    '-webkit-transition': 'all .5s linear',
                    '-webkit-transform-style': 'preserve-3d',
                    '-moz-transform': 'scale(1)',
                    'transform': 'scale(1)',
                    'transition': 'all .5s linear'
                });
            });
        $zoom.append($zoomOut);
        
        $("header").append($zoom);
        $zoomOut.hide();
    }
    
    function createPages(folder, arrayOfImages) {
        var docHeight = $(document).height(),
            docWidth = $(document).width(),
            $myBook = $("#mybook"), $newDiv, $newImg;
            
        window.containerWidth = docWidth, /* Add 10 pixels on left and right if book displays in full window*/
        window.containerHeight = docHeight - 54; /* Add space between top and bottom edges (Adobe's chrome is in the way, need space) */
        
        window.screenRatio = $(window).width() / $(window).height();
        
        if (window.screenRatio >= (800 / 600)) {
            if (!isPhablet) {
                window.diffH = $(window).height() - ($(window).height() - 90);
                window.diffW = 0;
            } else {
                window.diffH = $(window).height() - ($(window).height() - 80);
                window.diffW = 0;
            }
        } else {
            window.diffH = 0;
            window.diffW = ($(window).width() / 2) + 10;
        }

        $(arrayOfImages).each(function(i){
            $newDiv = $("<div></div>");
            $newDiv.attr('title', 'page');
            $myBook.append($newDiv);
            
            $newImg = $("<img/>");
            $newImg
                .attr('src',folder + '/' + this)
                .bind('load', function() {
                    var origWidth = parseInt($newImg.width),
                        origHeight = parseInt($newImg.height);
                        
                    if (window.diffW != 0) {
                        window.newDivWidth = $(window).width() - window.diffW;
                        window.newDivHeight = null;
                    } else {
                        window.newDivWidth = null;
                        window.newDivHeight = $(window).height() - window.diffH;
                    }
                    
                    if (window.newDivWidth) {
                        $(this).attr({
                            'width' : window.newDivWidth,
                            'height' : 'auto'
                        });
                    }
                    
                    if (window.newDivHeight) {
                        $(this).attr({
                            'width' : 'auto',
                            'height' : window.newDivHeight
                        });
                    }
                }).trigger('load');
                

            if (window.newDivWidth != null) {
                $newDiv.css({
                    'width' : window.newDivWidth,
                    'height' : 'auto'
                });
            } else {
                $newDiv.css({
                    'width' : 'auto',
                    'height' : window.newDivHeight
                });
            }
            
            $newDiv.append($newImg); 
        });
    }

    function drawBooklet() {
        var mybook = $("#mybook");
        
        $("#mybook div[title=page] img").each(function() {
            window.bookWidth = $(this).width();
            if (!window.lastWidthFound || window.bookWidth < window.lastWidthFound) {
                window.lastWidthFound = window.bookWidth;
            }
        });
        
        mybook.booklet({
            width: window.bookWidth * 2,
            height: containerHeight - 35,
            speed: bookCfg.pageFlipSpeed,
            manual: bookCfg.enableTapPageEdgeFlip,
            closed: true,
            autoCenter: bookCfg.autoCenterBook,
            pageNumbers: bookCfg.showPageNumbers,
            pagePadding: 0,
            tabs: bookCfg.showPrevNextButtons,
            arrows: false,
            nextControlText: bookCfg.nextButtonText,
            previousControlText: bookCfg.prevButtonText
        });
    }
    
    function bindDrag() {
        $("#mybook").draggable({
            scroll: true,
            cursor: "move"
        });
    }
    
    function refreshPage() {
        $("#zoom").show();
        $("#zoom p").hide();
        $("#zoom li")
            .html(bookCfg.reloadPageText)
            .css({
                'color':'red',
                'top':'48px'
            });
            
        window.setTimeout(function() {
            window.location.reload();
        }, 1000);
    }
});