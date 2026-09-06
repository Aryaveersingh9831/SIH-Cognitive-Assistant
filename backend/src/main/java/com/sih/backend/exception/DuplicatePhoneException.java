package com.sih.backend.exception;

public class DuplicatePhoneException extends RuntimeException {

    public DuplicatePhoneException(String message) {
        super(message);
    }
}
