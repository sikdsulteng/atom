"use strict";

(function ($) {

  $(loadTreeView);

  /**
   *
   * Pagination (using cookie storage) and state reset helper functions
   *
   */

  var cookiePrefix = 'browseHierarchyPaginator';
  var cookieSetParams = {'domain': document.domain};
  var totalRootNodes = 0;

  function getSkip()
  {
    return parseInt(YAHOO.util.Cookie.get(cookiePrefix + 'Skip'));
  }

  function setSkip(value)
  {
    YAHOO.util.Cookie.set(cookiePrefix + 'Skip', value, cookieSetParams);
  }

  function getLimit()
  {
    return parseInt(YAHOO.util.Cookie.get(cookiePrefix + 'Limit'));
  }

  function setLimit(value)
  {
    YAHOO.util.Cookie.set(cookiePrefix + 'Limit', value, cookieSetParams);
  }

  function initPagingAndStateIfNeeded()
  {
    // This check will detect null, "", NaN, etc. as NaN is the only JS value
    // that is treated as unequal to itself
    if (parseInt(getSkip()) !== parseInt(getSkip()) || parseInt(getLimit()) !== parseInt(getLimit()))
    {
      initPagingAndState();
    }
  }

  function initPagingAndState()
  {  
    setSkip(0);
    setLimit(10);

    // Only reset tree if it already exists
    if (jQuery("#fullwidth-treeview").jstree(true) !== false)
    {
      $("#fullwidth-treeview").jstree(true).clear_state();
      $("#fullwidth-treeview").jstree(true).refresh(true, true);
    }
  }

  function updateMoreLink()
  {
    var remaining = totalRootNodes - (getSkip() + getLimit());

    if (remaining > 0)
    {
      $('#treeview > .more').show();
      $('#fullwidth-treeview-more-count').text(remaining);
    }
    else
    {
      $('#treeview > .more').hide();
    }
  }

  function loadTreeView ()
  {
    var url  = 'Data';
    var detailUrl = '/informationobject/fullWidthTreeView';
    var $fwTreeView = $('<div id="fullwidth-treeview"></div>');
    var $fwTreeViewRow = $('<div id="fullwidth-treeview-row"></div>');
    var $mainHeader = $('#main-column h1');

    // True until a node is selected manually (not by state restoration)
    var refresh = true;

    // Initialize paging/state variables if neccessary
    initPagingAndStateIfNeeded();

    // Add tree-view div after main header
    $mainHeader.after(
      $fwTreeViewRow
        .append($fwTreeView)
    );

    // Declare jsTree options
    var options = {
      'plugins': ['state', 'types'],
      'types': {
        'default':    {'icon': 'fa fa-folder-o'},
        'Item':       {'icon': 'fa fa-file-text-o'},
        'File':       {'icon': 'fa fa-file-text-o'},
        'Series':     {'icon': 'fa fa-folder-o'},
        'Subseries':  {'icon': 'fa fa-folder-o'},
        'subfonds':   {'icon': 'fa fa-folder-o'},
        'Sous-fonds': {'icon': 'fa fa-folder-o'},
        'Fonds':      {'icon': 'fa fa-archive'},
        'Collection': {'icon': 'fa fa-archive'}
      },
      'core': {
        'data': {
          'url': function (node) {
            if (node.id === '#')
            {
              // Get first page of results
              var queryString = "?nodeLimit=" + getLimit();
              return window.location.pathname + url + queryString;
            }
            else
            {
              return node.a_attr.href + detailUrl;
            }
          },
          'dataFilter': function (response) {
            // Data from the initial request for hierarchy data contains
            // additional data relating to paging so we need to parse to
            // differentiate it.
            var data = JSON.parse(response);

            if (typeof data.nodes === "undefined") {
              // Data is an array of jsTree node definitions
              return JSON.stringify(data);
            } else {
              // Data includes additional data to jsTree data
              totalRootNodes = data.total; // Set variable outside of function scope

              updateMoreLink();

              return JSON.stringify(data.nodes);
            }
          },
          'data': function (node) {
            return node.id === '#' ?
              {} :
              {'firstLoad': false, 'referenceCode': node.original.referenceCode};
          }
        },
        'check_callback': function (operation, node, node_parent, node_position, more) {
          // Restrict possible client-side manipulation of tree
          return operation === 'deselect_all' || operation === 'create_node';
        }
      }
    };

    /**
     *
     * Listeners
     *
     */

    // When tree ready, add additional nodes if the user has paged to them
    var readyListener = function ()
    {
      // Determine how many nodes have already been displayed
      var currentTotalRootNodes = $('#fullwidth-treeview').jstree(true)._model.data['#'].children.length;

      // If not every node has been displayed, and all the nodes the user has
      // paged to haven't been displayed, then load more of them
      if (currentTotalRootNodes < totalRootNodes && currentTotalRootNodes < (getSkip() + getLimit()))
      {
        getAndAppendNodes(currentTotalRootNodes, getLimit(), readyListener);
      }
      else
      {
        updateMoreLink();

        refresh = false;
      }
    };

    // On node selection: change to the informationobject's page
    var selectNodeListener = function (e, data)
    {
      // If page has finished refreshing, deselect all nodes in case state has
      // restored selection
      if (!refresh)
      {
        $('#fullwidth-treeview').jstree("deselect_all");
        window.location = data.node.a_attr.href;
      }
    };

    // Initialize jstree with options and listeners
    $fwTreeView
      .jstree(options)
      .bind('ready.jstree', readyListener)
      .bind('select_node.jstree', selectNodeListener);

    function getAndAppendNodes(skip, limit, cb)
    {
      // Assemble query
      var queryString = "?skip=" + skip + "&nodeLimit=" + limit;
      var pagedUrl = window.location.pathname + url + queryString;

      // Get and append additional nodes
      $.ajax({
        url: pagedUrl,
        success: function(results) {
          results.nodes.forEach(function(node) {
            $("#fullwidth-treeview").jstree("create_node", "#", node, "last");
          });

          var remaining = results.total - (getSkip() + getLimit());

          if (remaining > 0)
          {
            $('#fullwidth-treeview-more-count').text(remaining);
          }
          else
          {
            $('#treeview > .more').hide();
          }

          $("#fullwidth-treeview").jstree(true).restore_state();

          if (typeof cb !== 'undefined')
          {
            cb();
          }
        }
      });
    }

    // Add "more" infinite paging link constructed so it'll be styled by existing CSS
    var $moreControl = $('<div id="treeview"><div class="more"><a class="more"><span id="fullwidth-treeview-more-count"></span> more</a></div></div>');

    // Clicking "more" will add next page of results to tree
    $moreControl.click(function() {
      setSkip(getSkip() + getLimit());
      getAndAppendNodes(getSkip(), getLimit());
    });
    $fwTreeView.parent().append($moreControl);

    // Add pagination/state reset link constructed so it'll be styled by existing CSS
    var $resetButton = $('<div id="fullwidth-treeview-reset-button"><a class="c-btn c-btn-submit">Reset</a></div>');

    // Clicking reset link will reset paging and tree state
    $resetButton.click(function()
    {
      initPagingAndState();
    });
    $('#main-column').parent().prepend($resetButton);
  }
})(jQuery);
