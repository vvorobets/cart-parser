import CartParser from './CartParser';

let parser;

beforeEach(() => {
    parser = new CartParser();
});

describe("CartParser - unit tests", () => {
    // Add your unit tests here.
    it('should return correct error object', () => {
        expect(parser.createError('cell', 0, 1, 'test string')).toEqual({type: 'cell', row: 0, column: 1, message: 'test string'});
    });
    it('should return error if table header missed', () => {
        expect(parser.validate('Mollis consequat,9.00,2\nTvoluptatem,10.32,1\n')).toHaveLength(3);
        expect(parser.validate('Mollis consequat,9.00,2\nTvoluptatem,10.32,1\n')[1]).toHaveProperty('message', 'Expected header to be named "Price" but received 9.00.');
        
    });
    it('should return error if one of the header columns missed', () => {
        expect(parser.validate('Product name,Price\nMollis consequat,9.00,2\n')).toHaveLength(1);
        expect(parser.validate('Product name,Quantity\nMollis consequat,9.00,2\n')).toHaveLength(2);
        expect(parser.validate('Product name,Quantity\nMollis consequat,9.00,2\n')[1]).toHaveProperty('row', 0);
        expect(parser.validate('Product name,Quantity\nMollis consequat,9.00,2\n')[0]).toHaveProperty('column', 1);
        expect(parser.validate('Product name,Quantity\nMollis consequat,9.00,2')[0]).toHaveProperty('message', 'Expected header to be named "Price" but received Quantity.');
        expect(parser.validate('Product name,Price\nMollis consequat,9.00,2')[0]).toMatchObject({column: 2, message: 'Expected header to be named "Quantity" but received undefined.'});
    });
    it('should return error if any of the product features is missed', () => {
        expect(parser.validate('Product name,Price,Quantity\n13.90,1')[0]).toMatchObject({column: -1, message: 'Expected row to have 3 cells but received 2.'});
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,1')[0]).toMatchObject({column: -1, message: 'Expected row to have 3 cells but received 2.'});
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,1')).toHaveLength(1);
    });
    it('should return error if product name is empty string', () => {
        expect(parser.validate('Product name,Price,Quantity\n,9.00,2')[0]).toMatchObject({row: 1, column: 0, message: 'Expected cell to be a nonempty string but received "".'});
        
        // (!) Probably, here "" is considered as proper name, because it creates a cell (with empty string) and passes if(!cell)
        expect(parser.validate('Product name,Price,Quantity\n"",9.00,2')[0]).toBeUndefined();
    });
    it('should return error if product price is not a positive number', () => {
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,abcd,1')[0]).toMatchObject({row: 1, column: 1, message: 'Expected cell to be a positive number but received "abcd".'});
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,-23,1')).toHaveLength(1);
        expect(parser.validate('Product name,Price,Quantity\nConsectetur adipiscing,\'\',10')[0]).toMatchObject({message: 'Expected cell to be a positive number but received "\'\'".'});
        
        // 0 still works fine - definitions may be 'not a negative number'
        expect(parser.validate('Product name,Price,Quantity\nConsectetur adipiscing,0,10')[0]).toBeUndefined();
    });
    it('should return error if product quantity is not a positive number', () => {
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,18.90,-12')[0]).toMatchObject({row: 1, column: 2, message: 'Expected cell to be a positive number but received "-12".'});
        expect(parser.validate('Product name,Price,Quantity\nScelerisque lacinia,18.90,abcd')).toHaveLength(1);
        expect(parser.validate('Product name,Price,Quantity\nConsectetur adipiscing,28.72,\'\'')[0]).toMatchObject({message: 'Expected cell to be a positive number but received "\'\'".'});
        
        // again, 0 still works fine - definitions may be 'not a negative number'
        expect(parser.validate('Product name,Price,Quantity\nConsectetur adipiscing,28.72,0')[0]).toBeUndefined();
    });
    it('should return correctly address errors', () => {
        expect(parser.validate('Product name,Price,Quantity\nMollis consequat,2\nTvoluptatem,abcd,1')[0]).toMatchObject({row: 1, column: -1, message: 'Expected row to have 3 cells but received 2.'});
        expect(parser.validate('Product name,Price,Quantity\nMollis consequat,2\nTvoluptatem,abcd,1')[1]).toMatchObject({row: 2, column: 1, message: 'Expected cell to be a positive number but received "abcd".'});
            });
    it('should return no errors if format is correct', () => {
        expect(parser.validate('Product name,Price,Quantity\n Mollis consequat,9.00,2')[0]).toBeUndefined();// []==false is true
    });

    it('should return a line from a valid CSV file converted to a JSON object', () => {
        expect(parser.parseLine('Mollis consequat,9.00,2\r')).toMatchObject({name: "Mollis consequat", price: 9.00, quantity: 2});
        expect(parser.parseLine('Tvoluptatem,10.32,1')).toMatchObject({name: "Tvoluptatem", price: 10.32, quantity: 1});
    });
    it('should return the correct total price of items added to the cart', () => {
        expect(Number(parser.calcTotal([{price: 2.72, quantity: 1},{price: 2, quantity: 2}]).toFixed(2))).toBe(6.72);
        expect(Number(parser.calcTotal([{price: 1.99, quantity: 1},{price: 0.99, quantity: 2}]).toFixed(2))).toBe(3.97);
    });
});

describe("CartParser - integration tests", () => {
    // Add your integration tests here.
    // it('should return the correct data from network request', () => {
    //     expect(parser.readFile('./samples/cart.csv')).toMatch('Product name,Price,Quantity\r\nMollis consequat,9.00,2\r\nTvoluptatem,10.32,1\r\nScelerisque lacinia,18.90,1\r\nConsectetur adipiscing,28.72,10\r\nCondimentum aliquet,13.90,1\r\n');
    // });
    it('should return the correct result after file request, parsing and calculation', () => {
        expect(parser.parse('./samples/cart2.csv')).toMatchObject({
            "items": [
                {
                    "name": "Mollis consequat",
                    "price": 1.00,
                    "quantity": 2
                },
                {
                    "name": "Tvoluptatem",
                    "price": 1.32,
                    "quantity": 1
                },
                {
                    "name": "Scelerisque lacinia",
                    "price": 1.90,
                    "quantity": 1
                },
                {
                    "name": "Consectetur adipiscing",
                    "price": 2.72,
                    "quantity": 10
                },
                {
                    "name": "Condimentum aliquet",
                    "price": 1.30,
                    "quantity": 1
                }
            ],
            "total": 33.72
        });
    });
});