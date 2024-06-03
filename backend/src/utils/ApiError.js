class ApiError extends Error {
 constructor(statusCode, message="Somthing went wrong", errors = [], stack){
    super(message)
    this.status = statusCode
    this.message = message
    this.data = null
    this.success = false
    this.erros = errors

    if(stack) {
        this.stack = stack
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
 }  
}