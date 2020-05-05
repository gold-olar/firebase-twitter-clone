class BaseController {    
    constructor(){
    }
    /**
     * Generic send success helper
     * @param res
     * @param data
     * @param message
     * @param token
     * @param status
     * @param header
     */
    sendSuccess(res, data, message, status, header) {
        let resp = { status: true };

        if (message)
            resp.message = message;

        if (data || data === [] || data === {})
            resp.data = data;

        status = status ? status : 200;
        resp.HttpStatus = status;        

        if (header) return res.header(header, token).status(status).json(resp);

        return res.status(status).json(resp);
    }

    /**
     * Generic send error helper
     * @param res
     * @param message
     * @param error
     * @param status
     */
    sendError(res, error, message, status) {
        let resp = { status: false };
        resp.message = message ? message : 'An error occurred, please try again';

        if (error)
            resp.error = error.stack;

        status = status ? status : 500;
        resp.HttpStatus = status; 

        return res.status(status).json(resp);
    }
}

module.exports = BaseController