import mysql from 'mysql2/promise';

// Object database
const dbConfig = {
    host: 'localhost',    
    user: 'root',         
    password: 'root',  
    database: 'db_telegram' 
};

// Save to database
export const saveToDatabase = async (groupName, url) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Retrieve groupId
        const [groupRows] = await connection.execute('SELECT id FROM `groups` WHERE name = ?', [groupName]);
        if (groupRows.length === 0) {
            throw new Error(`Group with name ${groupName} not found`);
        }
        
        const groupId = groupRows[0].id;
        
        // Insert URL into database
        const query = 'INSERT INTO urls (groupId, url) VALUES (?, ?)';
        const [results] = await connection.execute(query, [groupId, url]);
        
        console.log('Data saved:', results);
    } catch (error) {
        console.error('Error saving to database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Fetch from database
export const fetchDatabase = async (group, province, date) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT
                urls.url,
                \`groups\`.name AS groupName,
                province.name AS province,
                urls.createdAt AS createdAt
            FROM urls
            JOIN \`groups\` ON \`groups\`.id = urls.groupId
            JOIN province ON province.id = \`groups\`.provinceId
        `;

        const queryParams = [];

        // Add conditional WHERE clauses based on parameters
        if (group) {
            query += ' WHERE \`groups\`.name = ?';
            queryParams.push(group);
        }
        if (province) {
            query += `${group ? ' AND' : ' WHERE'} province.name = ?`;
            queryParams.push(province);
        }
        if (date) {
            query += `${group || province ? ' AND' : ' WHERE'} DATE(urls.createdAt) = ?`;
            queryParams.push(date);
        }

        const [rows] = await connection.execute(query, queryParams);

        if (rows.length === 0) {
            return null;
        }

        return rows; 
    } catch (error) {
        console.error('Error fetching from database:', error);
        throw error; 
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};