function Validator(formSelector) {
    var _this = this;
    var formRules = {};

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }



    // Neu co loi thi return error messages
    // Neu khong co loi thi return undefined
    var validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Vui lòng nhập email này'
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} kí tự`
            }
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự`
            }
        }
    };



    // Lay ra form element trong DOM theo `formSelector`
    var formElement = document.querySelector(formSelector);

    // chi xu ly khi co formElement tron DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]');
        for (var input of inputs) {

            var ruleInfo;
            var rules = input.getAttribute('rules').split('|');
            for (var rule of rules) {
                var isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    var ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                var ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {

                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lang nghe su kien de validate(blur, onchange,...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }
    }

    function handleValidate(event) {
        var rules = formRules[event.target.name];
        var errorMessage;
        for(var rule of rules){
            errorMessage = rule(event.target.value);
            if(errorMessage){
                break;
            }
        }
        // neu co loi thi hien thi message loi ra UI
        if (errorMessage) {
            var formGroup = getParent(event.target, '.form-group')

            if (formGroup) {
                formGroup.classList.add('invalid')
                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = errorMessage;
                }
            }
        }
        return !errorMessage
    }

    function handleClearError(event) {
        var formGroup = getParent(event.target, '.form-group')
        if (formGroup.classList.contains('invalid')) {
            formGroup.classList.remove('invalid');

            var formMessage = formGroup.querySelector('.form-message');
            if (formMessage) {
                formMessage.innerText = '';
            }
        }
    }

    
    // xu ly hanh vi submit form
    formElement.onsubmit = function (event) {
        event.preventDefault();


        // this keyword

        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }
        // khi khong co loi thi submit form
        if (isValid) {
            if (typeof _this.onSubmit === 'function') {

                var enableInputs = formElement.querySelectorAll('[name]');
                var formValues = Array.from(enableInputs).reduce(function (values, input) {
                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                            if (!input.matches(':checked'))
                                values[input.name] = '';
                            return values;
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value
                    }
                    return values;
                }, {});

                // goi lai ham onSubmit va tra ve kem gia tri cua form
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }
}