function testLog(output) {
    return (req, res, next) => {
        console.log(output);
        next();
    };
}

module.exports = { testLog };
