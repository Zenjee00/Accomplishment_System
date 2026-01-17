import React from 'react';

import ReCAPTCHA from 'react-google-recaptcha';

const RecaptchaComponent = ({ onChange }) => {
    return (
        <div className="recaptcha-container">
            <ReCAPTCHA
                sitekey="6LfvAN8qAAAAAGI8VnXdiccBLJruM38oq13lsHOG"
                onChange={onChange}
            />
        </div>
    );
};

export default RecaptchaComponent;