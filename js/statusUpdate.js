jQuery(function ()
  {
    // Create string representing currently displayed slugs, if any
    var slugsDisplayedString = 'slugsDisplayed' in Qubit ? Qubit.slugsDisplayed.join(',') : '';

    jQuery.ajax({
      url: '/user/status?slugs=' + slugsDisplayedString,
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
        }
    });
  });
