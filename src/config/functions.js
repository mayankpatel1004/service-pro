const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const db = require('./database');
var now = new Date();
const moment = require('moment');
const nodemailer = require("nodemailer");
const { CONSTANTS,DBTABLES,ACTION_MESSAGES } = require("./constants");
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');
var fs = require('fs');

const {
    mailPassword,
    mailUser,
    mailHost,
    mailPort,
    mailSecure,
} = require("../config/email");
const { consoleLog } = require("../route/logger");
let transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    auth: {
        user: mailUser,
        pass: mailPassword,
    },
});

module.exports = {
    getMetaDetails(end_points){
        return new Promise(async (resolve, reject) => {

            let sqlQuery = `SELECT * FROM ${DBTABLES.META_DETAILS} WHERE end_points = '${end_points}' AND deleted_status = 'N'`;
            db.query(sqlQuery, (err, result) => {

                if(result.length == 0){
                    let sqlInsert = `INSERT INTO ${DBTABLES.META_DETAILS} SET end_points = '${end_points}',page_title = '${CONSTANTS.DEFAULT_TITLE}', meta_title = '${CONSTANTS.DEFAULT_META_TITLE}', meta_description = '${CONSTANTS.DEFAULT_META_DESCRIPTION}'`;
                    db.query(sqlInsert);
                }

                if(err){
                    reject(err);
                } else {
                    let objMetaDetails = [];
                    if(result.length > 0){
                        objMetaDetails = [
                            {
                                page_title: result[0].page_title,
                                meta_title: result[0].meta_title +" - "+ CONSTANTS.COMPANY_NAME,
                                meta_description: result[0].meta_description
                            }
                        ]
                    } else {
                        objMetaDetails = [
                            {
                                page_title: CONSTANTS.DEFAULT_TITLE,
                                meta_title: CONSTANTS.DEFAULT_META_TITLE,
                                meta_description: CONSTANTS.DEFAULT_META_DESCRIPTION
                            }
                        ]
                    }
                    resolve(objMetaDetails);
                }
            })
        });
    },
    renderData(req,res,responseData,route_name){
        let routename = route_name.replace(/\//g, '');
        if(route_name.length > 30){routename = route_name;}
        return process.env.IS_API === 'Y' ? res.send(responseData) : res.render(routename, responseData);
    },
    async loginDetails(req) {
        const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
        );
        if(!decoded){
            return res.send({success:0,message:"Invalid Token"});
        }
        return decoded.data;
    },
    checkTokenExists(req, res, next) {
        const authHeader = req.headers["authorization"];
        const token =
            (authHeader ? authHeader.split(" ")[1] : "") ||
            (req.cookies ? req.cookies.jwt : "") ||
            (req.query ? req.query.token : "");
    
        if (!token) {
            return res.send({success:0,message:"Missing Token"});
        }
    
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET, { algorithms: ["HS256"] }
            );
    
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
    
            next();
        } catch (err) {
            let redirectUrl = "/login?error=invalid_token";
    
            if (err.name === "TokenExpiredError") {
                redirectUrl = "/login?error=expired_token";
            } else if (err.name === "JsonWebTokenError") {
                redirectUrl = "/login?error=malformed_token";
            }
    
            return res.redirect(redirectUrl);
        }
    },
    sanitize(str) {
        return (str || '').replace(/'/g, "''"); // Double up single quotes
    },
    getHostUrl(req) {
        return req.protocol + '://' + req.get('host');
    },
    getTitleAlias(title, options = {}) {
        const {
          separator = '-',
          lowerCase = true,
          strict = true
        } = options;
      
        let alias = title;
      
        if (lowerCase) {
          alias = alias.toLowerCase();
        }
      
        alias = alias
          .replace(/\s+/g, separator)      // Replace spaces with separator
          .replace(/[^\w\-]+/g, '')       // Remove non-word chars except separator
          .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Remove duplicate separators
          .replace(new RegExp(`^\\${separator}+`), '') // Trim from start
          .replace(new RegExp(`\\${separator}+$`), ''); // Trim from end
      
        if (strict) {
          alias = alias.replace(/[^a-z0-9\-]/g, ''); // Remove any remaining special chars
        }
      
        return alias;
    },
    getSectionMaxNo(item_type = 'page'){
        return new Promise(async (resolve, reject) => {
            let sqlGetMaxNo = `SELECT MAX(display_order) as display_order FROM ${DBTABLES.ITEM_SECTION} WHERE item_type = '${item_type}'`;
            db.query(sqlGetMaxNo, async(error, results, fields) => {
                let max_number = 1;
                if(results && parseInt(results[0].display_order) > 0){
                    max_number = parseInt(results[0].display_order) + parseInt(1);
                }
                resolve(max_number);
            });
        });
    },
    getItemsMaxNo(item_type = 'page'){
        return new Promise(async (resolve, reject) => {
            let sqlGetMaxNo = `SELECT MAX(display_order) as display_order FROM ${DBTABLES.ITEMS} WHERE item_type = '${item_type}'`;
            db.query(sqlGetMaxNo, async(error, results, fields) => {
                let max_number = 1;
                if(results && parseInt(results[0].display_order) > 0){
                    max_number = parseInt(results[0].display_order) + parseInt(1);
                }
                resolve(max_number);
            });
        });
    },
    uniquePK(length) {
        return new Promise(async (resolve, reject) => {
            var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var result = '';
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            resolve(result);
        });
    },
    getCreatedDate() {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    },
    displayStatus() {
        return [{
            'ID': 'Y',
            'NAME': 'Active'
        }, {
            'ID': 'N',
            'NAME': 'Inactive'
        }];
    },
    serviceType() {
        return [{
            'ID': 'Service',
            'NAME': 'Service'
        }, {
            'ID': 'Program',
            'NAME': 'Program'
        }];
    },
    getAllRoles() {
        return new Promise(async (resolve, reject) => {
            let sqlQuery = `SELECT role_id as ID,role_title as NAME FROM role WHERE deleted_status = 'N' ORDER BY role_id ASC`;
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        });
    },
    sentAnEmail(to, subject, text, html) {
        return new Promise(async (resolve, reject) => {

            let header_html = `<table width="100%" border="1" cellspacing="0" cellpadding="5" style="font-size:14px; font-family:Arial, Helvetica, sans-serif;"><tr><td>`;
            header_html += `<table width="100%" border="0" cellspacing="0" cellpadding="5" style="color:${CONSTANTS.TOP_BG_COLOR}"><tr><td align="center" colspan="2" bgcolor="${CONSTANTS.TOP_BG_COLOR}"><img src="${CONSTANTS.LOGO_URL_EMAIL}" alt="${CONSTANTS.LOGO_URL_EMAIL}" style="width:20%" /></td></tr><tr><td>&nbsp;</td></tr>`;

            let content_html = `<tr><td>${html}</td></tr>`;

            let footer_html = `<tr><td>&nbsp;</td></tr><tr><td align="center" colspan="3" bgcolor="${CONSTANTS.TOP_BG_COLOR}" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};"><h3>${CONSTANTS.COMPANY_NAME}</h3>${CONSTANTS.COMPANY_ADDRESS} ${CONSTANTS.COMPANY_ADDRESS2} ${CONSTANTS.COMPANY_CITY}, ${CONSTANTS.COMPANY_STATE},${CONSTANTS.COMPANY_COUNTRY} - ${CONSTANTS.COMPANY_ZIPCODE}<br /> <a rel="nofollow" href="mailto:${CONSTANTS.COMPANY_EMAIL}" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};">${CONSTANTS.COMPANY_EMAIL}</a><br /> <a rel="nofollow" style="color:${CONSTANTS.FOOTER_TEXT_COLOR};" href="${CONSTANTS.COMPANY_WEBSITE}" target="_blank">${CONSTANTS.COMPANY_WEBSITE}</a><br /><br /></td></tr>`;
            footer_html += `</td></tr></table>`;

            html = header_html + content_html + footer_html;


            try {
                let mailData = {
                    from: `${process.env.AUTH_NAME} <${process.env.AUTH_USER}>`,
                    to: to,
                    subject: subject,
                    text: text,
                    html: html,
                };

                transporter.verify(async (error, success) => {
                    if (error) {
                        if (error.code === 'EAUTH' || error.responseCode === 535) {
                            reject(error);
                        }
                    } else {
                        const results = await transporter.sendMail(mailData);
                        resolve(results);
                    }
                });
            } catch (error) {
                consoleLog(error);

            }
        });
    },
    exportToCSV(req,res,exportItems,report_name,csvStringifier){
        let first_line = report_name+" Details Report\n";
        let csvContent = first_line+"\n";
        csvContent += csvStringifier.getHeaderString();
        csvContent += csvStringifier.stringifyRecords(exportItems);
        let filename = new Date().getTime()+"_"+report_name+".csv";
        let full_path = path.resolve(__dirname, '../../public/export/'+filename);
        fs.writeFile(full_path, csvContent, (err) => {
            if (err) throw err;
            let url = new URL(req.protocol + 's://' + req.get('host'))+"public/export/"+filename;;
            if(process.env.IS_LIVE == 0){
                url = new URL(req.protocol + '://' + req.get('host'))+"public/export/"+filename;
            }
            setTimeout(() => {
                fs.unlink(full_path, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return;
                    }
                    console.log('File deleted successfully');
                    });
            }, 2000);
            res.send({
                success: ACTION_MESSAGES.SUCCESS_FLAG,
                data: [],
                arrTotalPages: 0,
                url:url
            });
        });
    }
}