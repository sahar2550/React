import React from 'react';

export default function PopupBottom({ title, onPress, backColor = 'dodgerblue', textColor = 'white' }) {
    return (
        <div
            onClick={() => {
                if (!!onPress) {
                    console.log('====================================');
                    console.log('click ok');
                    console.log('====================================');
                    onPress();
                }
            }}
            className="m-2"
            style={{
                fontSize: "15px",
                borderRadius: 8,
                backgroundColor: backColor,
                width: '50%',
                color: textColor,
                marginTop: 4,
                marginLeft: 2,
                merginRight: 2
            }}>
            {title}
        </div>
    );
}
