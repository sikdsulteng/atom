jQuery(function ()
  {
    jQuery.ajax({
      url: '/user/status?slugs=' + Qubit.slugsDisplayed.join(','),
      dataType: 'json',
      success: function (results)
        {
          var clipboard = results.clipboard;

          // Indicate which items are in the clipboard
          jQuery('button.clipboard').each(function ()
            {
              if (jQuery.inArray(jQuery(this).attr('data-clipboard-slug'), clipboard.slugs) != -1)
                {
                  jQuery(this).addClass('added');
                }
            });

          // Show clipboard count in menu
          var spanExists = jQuery('#clipboard-menu > button > span').length;

          if (spanExists && clipboard.count)
            {
              jQuery('#clipboard-menu > button > span').text(clipboard.count);
            }
          else if (clipboard.count)
            {
              var spanEl = jQuery('<span></span>');
              spanEl.text(clipboard.count);
              jQuery('#clipboard-menu > button').append(spanEl);
            }
          else
            {
              jQuery('#clipboard-menu > button > span').remove();
            }

          // Add counts of each type of object in clipboard
          if (clipboard.objectCountDescriptions.length)
            {
              jQuery('#count-block').html(clipboard.objectCountDescriptions.join('<br />'));
            }

          // Display appropriate user menu
          var userMenuId = results.hasOwnProperty('user') ? 'user-menu' : 'user-menu-unauth';
          jQuery('#' + userMenuId).show();

          // If user is authenticated, show username, etc.
          if (userMenuId == 'user-menu')
            {
              jQuery('#' + userMenuId + ' > button').text(results.user.username);
              jQuery('#user-menu-username').text(results.user.username);
            }

          // Add main menu items
          results.menus.mainItems.forEach(function(item)
            {
              var divEl = jQuery("<div id='" + item.name + "-menu' data-toggle='tooltip' data-title='" + item.label + "'></div>");
              divEl.append(jQuery('<button class="top-item" data-toggle="dropdown" data-target="#" aria-expanded="false">' + item.label + '</button>'));
              var dropDownDivEl = jQuery('<div class="top-dropdown-container"></div>');
              dropDownDivEl.append(jQuery('<div class="top-dropdown-arrow"><div class="arrow"></div></div>'));
              dropDownDivEl.append(jQuery('<div class="top-dropdown-header"><h2>' + item.label + '</h2></div>'));

              var ulEl = jQuery('<ul></ul>');

              item.items.forEach(function(item)
                {
                  ulEl.append('<a href="' + item.a.path + '">' + item.a.options.label + '</a>');
                });

              var bodyDivEl = jQuery('<div class="top-dropdown-body"></div>');
              bodyDivEl.append(ulEl);
              dropDownDivEl.append(bodyDivEl);

              dropDownDivEl.append(jQuery('<div class="top-dropdown-bottom"></div>'));
              divEl.append(dropDownDivEl);
              jQuery('#top-bar > nav').append(divEl);
            });
        }
    });
  });
