var isPhablet = false,
    bookCfg,
    magId = getQueryString("magId"),                //Get magId from querystring
    issueDate = getQueryString("issueDate"),        //Get issueDate from querystring
    issueDir = 'brands/' + magId + '/' + issueDate, //folder location of issue based on querystring values
    pageDir;
    
$(document).ready(function() {
    // Shim for IE9 to allow console.log
    if (!window.console) (function() {
        var __console, Console;
    
        Console = function() {
            var check = window.setInterval(function() {
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
    
    // Detect most common Tablets and Phones otherwise treat as standard web browser
    if (/iPad|iPhone/i.test(navigator.userAgent) ||                     /* iPad or iPhone */
        /(?:Silk|Kindle|KFOT|FKTT|KFJW)/.test(navigator.userAgent) ||   /* Kindle Fire */
        /NOOK/.test(navigator.userAgent) ||                             /* Nook */
        /Android/.test(navigator.userAgent)                             /* Android */
       ) { isPhablet = true; }

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
        url: issueDir + '/config.json',
        contentType: 'application/json',
        dataType: 'json',
        success: function(data, responseText) {
            // Inject issue stylesheet into <head> if config.json is found in issueDir
            $('head').append('<link rel="stylesheet" href="' + issueDir + '/styles.css" type="text/css" />');
            
            var pageArray = new Array(), html;
            
            bookCfg = data;
            
            console.log("config.json\n" + responseText);
            
            pageDir = issueDir + '/' + bookCfg.bookPageFolder;
            
            $.each(bookCfg.bookPages[0], function(i, item){
                pageArray.push(item);
            });
            
            //Create pages using images specified in JSON
            createPages(pageDir, pageArray);
            
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
            
            drawZoom(); //Need to draw zoom even if zoom is disabled - same div used for "Reloading..." message
            
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

            window.setTimeout(drawBooklet, 2000);
            
            $("#mybook").ready(function() {
                // Refresh page on initial load (fixes any broken images if not cached)
                if (!window.location.hash || window.location.hash == "#2") {
                    window.setTimeout(function() {
                        window.location.hash = "#1";
                        window.location.reload();
                    }, 1000);
                } else {
                    window.location.hash = "#2";
                }
            });
        },
        error: function(data) {
            console.log("config.json\n" + data.statusText + "\n" + data.status);
        }
    });
    
    function drawZoom() {
        var html, $zoom, $zoomIn, $zoomOut;
        
        $zoom = $("<ul></ul>");
        $zoom.attr('id','zoom');
        
        $zoomIn = $("<li></li>");
        html = ''.concat(
            "<img src='images/spacer.gif' class='zoom-in left' width='1' height='1' align='left' border='0'/>",
            "<span class='text'>" + bookCfg.zoomInText + "</span>",
            "<img src='images/spacer.gif' class='zoom-in right' width='1' height='1' align='right' border='0'/>"
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
            "<img src='images/spacer.gif' class='zoom-out left' width='1' height='1' align='left' border='0'/>",
            "<span class='text'>" + bookCfg.zoomOutText + "</span>",
            "<img src='images/spacer.gif' class='zoom-out right' width='1' height='1' align='right' border='0'/>"
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
        var $windowW = $(window).width(),
            $windowH = $(window).height(),
            $aspectRatio = $windowW / $windowH,
            $myBook = $("#mybook"),
            $newDiv,
            $newImg,
            $diffH,
            $diffW,
            $newDivW,
            $newDivH;
        
        if ($aspectRatio >= (4/3)) {
            if (!isPhablet) {
                $diffH = $windowH - ($windowH - 90);
                $diffW = 0;
            } else {
                $diffH = $windowH - ($windowH - 80);
                $diffW = 0;
            }
        } else {
            $diffH = 0;
            $diffW = ($windowW / 2) + 10; // Add 10 to reduce chance x-axis overflow
        }

        $(arrayOfImages).each(function(i){
            $newDiv = $("<div></div>");
            $newDiv.attr('title', 'page');
            $myBook.append($newDiv);
            
            $newImg = $("<img/>");
            $newImg
                .attr('src', folder + '/' + this)
                .bind('load', function() {
                    if ($diffW != 0) {
                        $newDivW = $windowW - $diffW;
                        $newDivH = null;
                    } else {
                        $newDivW = null;
                        $newDivH = $windowH - $diffH;
                    }
                    
                    if ($newDivW) {
                        $(this).attr({
                            'width' : $newDivW,
                            'height' : 'auto'
                        });
                    }
                    
                    if ($newDivH) {
                        $(this).attr({
                            'width' : 'auto',
                            'height' : $newDivH
                        });
                    }
                }).trigger('load');
                

            if ($newDivW != null) {
                $newDiv.css({
                    'width' : $newDivW,
                    'height' : 'auto'
                });
            } else {
                $newDiv.css({
                    'width' : 'auto',
                    'height' : $newDivH
                });
            }
            
            $newDiv.append($newImg); 
        });
    }

    function drawBooklet() {
        var mybook = $("#mybook"),
            $bookWidth,
            $bookHeight,
            $lastWidthFound;
        $("#mybook div[title=page] img").each(function() {
            $bookWidth = $(this).width();
            if (!$lastWidthFound || $bookWidth > $lastWidthFound) {
                $lastWidthFound = $bookWidth;
                $bookHeight = $(this).height();
            }
        });
        
        mybook.booklet({
            width: $lastWidthFound * 2,
            height: $bookHeight,
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

function getQueryString(sVar) {
    urlStr = window.location.search.substring(1);
    sv = urlStr.split("&");
    for (i=0;i< sv.length;i++) {
        ft = sv [i].split("=");
        if (ft[0] == sVar) {
            return ft[1];
        }
    }
}

function setCookie(c_name, value, exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
    console.log("cookie set: " + c_name);
}

function getCookie(c_name)
{
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    
    if (c_start == -1) {
        c_start = c_value.indexOf(c_name + "=");
    }
    
    if (c_start == -1) {
        c_value = null;
    } else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start,c_end));
    }
    return c_value;
}