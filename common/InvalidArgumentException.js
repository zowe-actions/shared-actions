/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2021
 */

/**
 * An exception that can be thrown if an argument is invalid or missing.
 */

class InvalidArgumentException extends Error {
    /**
     * Construct the exception.
     *
     * @param argument   The argument name which value is invalid.
     * @param message    The exception message.
     */
    constructor(argument, message) {
        super(message ? message : "Argument " +argument +" is not provided or invalid")
        this.argument = argument
    }
}

export default InvalidArgumentException; 