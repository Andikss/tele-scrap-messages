import { Telegraf } from 'telegraf';
import { saveToDatabase, fetchDatabase } from './database.js';
import dotenv from 'dotenv'

dotenv.config();

// Inisialiasi Bot Token
const client = new Telegraf(process.env.TELE_BOT_TOKEN);

// Daftar user yang akan ditandai
const users = new Set(['AndikaDevs']);

// Mendeteksi ketika user yang ditandai mengirim foto
client.on('photo', async (ctx) => {
    try {
        const username = ctx.message.from.username; // Username pengirim
        if (users.has(username)) {
            const groupName = ctx.chat.title || 'Private Chat'; // Nama grup atau "Private Chat"
            const messageId = ctx.message.message_id; // ID pesan foto
            const chatId = ctx.chat.id.toString().replace('-100', ''); // ID chat
            const messageUrl = `https://t.me/c/${chatId}/${messageId}`; // URL pesan
            
            // Simpan data ke database
            saveToDatabase(groupName, messageUrl);
        }
    } catch (error) {
        console.error('Error handling photo message:', error);
    }
});

client.command('get', async (ctx) => {
    try {
        const commandParts = ctx.message.text.split(' ');
        const date = commandParts[1];

        // Memastikan tanggal yang diberikan sesuai format
        if (!date) {
            ctx.reply('Harap berikan tanggal dalam format: /get YYYY-MM-DD');
            return;
        }

        // Meminta user memilih opsi filter menggunakan keyboard inline
        ctx.reply('Pilih opsi filter:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Berdasarkan Provinsi', callback_data: 'province' },
                        { text: 'Berdasarkan Grup', callback_data: 'group' }
                    ]
                ]
            }
        });

        // Handler action ketika user memilih 'province'
        client.action('province', async (ctx) => {
            ctx.reply('Masukkan nama provinsi:');
            // Menunggu input dari user
            client.on('text', async (ctx) => {
                const province = ctx.message.text;
                // Ambil data dari database berdasarkan provinsi dan tanggal
                const data = await fetchDatabase(null, province, date);

                // Check if data is null or empty
                if (!data || data.length === 0) {
                    ctx.reply('Data tidak ditemukan.');
                    return;
                }

                // Format dan kirim respons ke user
                data.forEach(item => {
                    const response = `
${item.groupName}, ${item.province}\n
url:
${item.url}\n
${item.createdAt}
                    `;
                    ctx.reply(response);
                });
            });
        });

        // Handler action ketika user memilih 'group'
        client.action('group', async (ctx) => {
            ctx.reply('Masukkan nama grup:');
            // Menunggu input dari user
            client.on('text', async (ctx) => {
                const group = ctx.message.text;
                // Ambil data dari database berdasarkan grup dan tanggal
                const data = await fetchDatabase(group, null, date);

                // Check if data is null or empty
                if (!data || data.length === 0) {
                    ctx.reply('Data tidak ditemukan.');
                    return;
                }

                // Format dan kirim respons ke user
                data.forEach(item => {
                    const response = `
${item.groupName}, ${item.province}\n
url:
${item.url}\n
${item.createdAt}
                    `;
                    ctx.reply(response);
                });
            });
        });

    } catch (error) {
        console.error('Error handling /get command:', error);
        ctx.reply('Terjadi kesalahan saat memproses permintaan Anda.');
    }
});

client.launch();

process.once('SIGINT', () => client.stop('SIGINT'));
process.once('SIGTERM', () => client.stop('SIGTERM'));