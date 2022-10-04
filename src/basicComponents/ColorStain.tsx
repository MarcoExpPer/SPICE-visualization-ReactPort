/**
 * @fileoverview This file creates a simple SVG image that looks like a stain.
 * @package Requires React package. 
 * @author Marco Expósito Pérez
 */

//Local files
import '../style/base.css';

interface ColorStainProps {
    color: string;
    scale?: number;
}

/**
 * Basic UI component that execute a function when clicked
 */
export const ColorStain = ({
    color,
    scale = 1,
}: ColorStainProps) => {


    return (
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
            style={{ verticalAlign: "middle" }}
            height={`${20 * scale}px`}
            viewBox="0 0 142.000000 142.000000"
            preserveAspectRatio="xMidYMid meet">

            <g transform="translate(0.000000,142.000000) scale(0.100000,-0.100000)"
                fill={color} stroke="none">
                <path d="M929 1306 c-13 -20 -27 -36 -32 -36 -4 0 -33 -39 -64 -87 -31 -49
-77 -115 -102 -147 -25 -33 -49 -64 -54 -70 -5 -7 -11 -5 -18 7 -5 9 -22 17
-36 17 -21 0 -24 4 -20 22 15 56 -45 79 -84 31 -12 -16 -19 -21 -17 -13 8 24
-11 50 -37 50 -24 0 -74 -39 -93 -75 -11 -19 -11 -19 -12 3 0 38 -18 62 -46
62 -36 0 -104 -56 -104 -85 0 -27 24 -49 45 -41 19 7 19 -1 1 -51 -17 -48 -3
-89 29 -86 11 1 27 -3 36 -8 19 -10 48 -1 88 28 l24 17 -25 -39 c-24 -39 -104
-201 -127 -258 -16 -41 -14 -65 8 -77 28 -14 28 -14 65 26 l33 37 20 -20 c11
-11 26 -22 32 -24 15 -5 -20 -89 -45 -110 -9 -7 -29 -37 -46 -65 -16 -29 -36
-58 -43 -64 -21 -18 -18 -57 4 -70 29 -15 52 -2 139 77 56 50 85 70 98 67 14
-3 48 22 122 91 78 74 102 92 102 76 0 -36 29 -42 84 -14 42 21 48 22 42 7
-40 -105 -19 -193 39 -161 11 6 26 12 34 13 20 4 58 53 71 91 14 39 -1 73 -30
73 -24 0 -24 0 -5 69 18 69 8 91 -40 91 -40 0 -41 3 -19 76 15 53 8 94 -16 94
-11 0 39 105 70 150 9 14 33 61 53 104 39 87 37 116 -8 116 -19 0 -34 -15 -69
-67 -48 -71 -116 -158 -116 -149 0 6 52 86 98 151 36 51 42 68 32 85 -6 9 -1
24 11 42 29 40 22 72 -17 76 -26 3 -35 -3 -55 -32z"/>
            </g>
        </svg>
    );
};
