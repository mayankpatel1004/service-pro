module.exports = {
    appSecret : process.env.SECRET_KEY,
    mailUser : process.env.AUTH_USER,
    mailPassword : process.env.AUTH_PASS,
    mailHost : "smtp.hostinger.com",
    //mailHost : process.env.HOST,
    mailPort : process.env.PORT,
    mailSecure : process.env.SECURE,
    mailName: process.env.AUTH_NAME,
}