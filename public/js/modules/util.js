// console.log('load module util.js')

export const romanize = num => {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup ) {
        while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
        }
    }
    return roman;
}

export const dom = (innerString, rootElement='DIV') => {
    const div = document.createElement(rootElement); // only for parsing
    div.innerHTML = innerString;
    return div.firstChild;
}

Number.prototype.times = function(callback) {
    // console.log(`prototype.times.this=[${this}]`);       // 'this' contains the value
    return Array.from({length:this}, (x, idx) => callback(idx));
}

Array.prototype.equals = function(arr) {
    if(arr==undefined||arr.length!==this.length) return false;
    return this.every((val, idx) => val===arr[idx]);
}
