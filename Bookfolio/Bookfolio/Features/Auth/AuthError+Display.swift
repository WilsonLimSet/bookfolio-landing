import Foundation
import Auth

extension Error {
    var userFacingMessage: String {
        if let authError = self as? AuthError {
            return authError.displayMessage
        }
        if let serviceError = self as? AuthServiceError {
            return serviceError.localizedDescription
        }
        if self is URLError {
            return "No internet connection. Please check your network and try again."
        }
        return "Something went wrong. Please try again."
    }
}

extension AuthError {
    var displayMessage: String {
        switch self {
        case let .api(message, errorCode, _, _):
            switch errorCode {
            case .invalidCredentials:
                return "Invalid email or password."
            case .userAlreadyExists:
                return "An account with this email already exists."
            case .emailNotConfirmed:
                return "Please verify your email first."
            case .weakPassword:
                return "Password is too weak. Use at least 6 characters."
            case .overRequestRateLimit:
                return "Too many attempts. Please wait a moment."
            default:
                return message
            }
        case .weakPassword:
            return "Password is too weak. Use at least 6 characters."
        default:
            return "Something went wrong. Please try again."
        }
    }
}
