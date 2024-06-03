class ApiResponse {
    constructor (statusCode, messege="success", data,){
            this.statusCode = statusCode
            this.data = data
            this.messege = messege
            this.success = statusCode < 400 
    }
}