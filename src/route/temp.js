html += `<table width="100%" border="1" cellspacing="0" cellpadding="5" style="font-size:14px; font-family:Arial, Helvetica, sans-serif;"><tr><td>`;
      
                  // header part
                  html += `<table width="100%" border="0" cellspacing="0" cellpadding="5" style="color:${CONSTANTS.TOP_BG_COLOR}"><tr><td align="center" colspan="2" bgcolor="${CONSTANTS.TOP_BG_COLOR}"><img src="${CONSTANTS.LOGO_URL_EMAIL}" alt="${CONSTANTS.LOGO_URL_EMAIL}" style="width:20%" /></td></tr><tr><td>&nbsp;</td></tr>`;
      
                  //content part
                  html += `<tr><td><h4>Hello ${user_name},</h4><p>Your password has been changed on ${CONSTANTS.COMPANY_NAME}.</p><p>If you have any questions or need further assistance, please contact us.</p></td></tr>`;

                  //footer part
                  html += `<tr><td>&nbsp;</td></tr><tr><td align="center" colspan="3" bgcolor="${CONSTANTS.TOP_BG_COLOR}" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};"><h3>${CONSTANTS.COMPANY_NAME}</h3>${CONSTANTS.COMPANY_ADDRESS} ${CONSTANTS.COMPANY_ADDRESS2} ${CONSTANTS.COMPANY_CITY}, ${CONSTANTS.COMPANY_STATE},${CONSTANTS.COMPANY_COUNTRY} - ${CONSTANTS.COMPANY_ZIPCODE}<br /> <a rel="nofollow" href="mailto:${CONSTANTS.COMPANY_EMAIL}" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};">${CONSTANTS.COMPANY_EMAIL}</a><br /> <a rel="nofollow" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};" href="${CONSTANTS.COMPANY_WEBSITE}" target="_blank">${CONSTANTS.COMPANY_WEBSITE}</a><br /><br /></td></tr>`;

                  html += `</td></tr></table>`;
                  