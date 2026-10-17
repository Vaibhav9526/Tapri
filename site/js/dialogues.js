// Everything anyone says. Speech is ONLY chit-chat between neighbours plus the short, natural exchanges at the counter.
// Voice keys: m, m2 = two different male customers · f, f2 = two female customers · o = the shop owner · h = the helper boy.
// tools/generate_audio.mjs and the ElevenLabs session read ALL_LINES() to make voice clips; manifest key = "<voice>|<text>".
(() => {
  const chats = [
    { g: 'mm', lines: [[0, 'कल का मैच देखा? आख़िरी ओवर में तो जान ही निकल गई!'], [1, 'अरे हाँ यार! मैंने तो टीवी बंद ही कर दिया था'], [0, 'फिर वापस चालू किया क्या?'], [1, 'और क्या! छक्का लगा तो पूरी गली चिल्ला उठी']] },
    { g: 'mm', lines: [[0, 'आज तो बड़ी गर्मी है, पंखा भी हवा नहीं दे रहा'], [1, 'बारिश आ जाए तो मज़ा आ जाए, बस चाय और पकौड़े'], [0, 'पकौड़े तो राकेश भैया के ही बेस्ट हैं'], [1, 'हाँ, और चटनी तो कमाल की बनाते हैं']] },
    { g: 'mm', lines: [[0, 'ऑफिस में आज फिर मीटिंग ही मीटिंग थी'], [1, 'यार, इसीलिए तो शाम को यहाँ आ जाता हूँ'], [0, 'चाय पर सब टेंशन भूल जाती है'], [1, 'सही बात है, ये टपरी तो थेरेपी है']] },
    { g: 'mm', lines: [[0, 'आज ट्रैफिक ने तो हद कर दी, एक घंटा लग गया'], [1, 'फ्लाईओवर का काम कब ख़त्म होगा, पता नहीं'], [0, 'हर साल बस यही सुनते हैं'], [1, 'चलो, कम से कम चाय तो मिल गई यहाँ']] },
    { g: 'mm', lines: [[0, 'बेटे का रिज़ल्ट आया कल'], [1, 'अरे वाह! कैसा रहा?'], [0, 'अच्छे नंबर आए, पर अब कह रहा है मोबाइल चाहिए'], [1, 'हाहा, ये तो हर घर की कहानी है']] },
    { g: 'mm', lines: [[0, 'नई फ़िल्म देखी है क्या?'], [1, 'अभी नहीं, सुना है गाने बहुत अच्छे हैं'], [0, 'गाने तो पुराने वाले ही बेस्ट थे'], [1, 'सही कह रहा है, किशोर कुमार की बात ही अलग थी']] },
    { g: 'mm', lines: [[0, 'दिवाली आने वाली है, बाज़ार में बड़ी भीड़ होगी'], [1, 'हाँ, अभी से दुकानें सज गई हैं'], [0, 'इस बार मिठाई घर पर ही बनवाएँगे'], [1, 'तो हमें भी बुला लेना']] },
    { g: 'mm', lines: [[0, 'टमाटर देखा, कितने के हो गए हैं?'], [1, 'अरे मत पूछ, सब्ज़ी लेने जाओ तो जेब हल्की हो जाती है'], [0, 'आजकल हर चीज़ महँगी हो गई है'], [1, 'इसीलिए तो चाय पर ही गुज़ारा है']] },
    { g: 'mm', lines: [[0, 'कल रात बिजली गई थी, पूरी रात गर्मी में कटी'], [1, 'हमारे यहाँ भी, दो घंटे बाद आई'], [0, 'इन्वर्टर लगवा लेना चाहिए'], [1, 'पहले चाय पिला, फिर इन्वर्टर की बात करेंगे']] },
    { g: 'mm', lines: [[0, 'याद है, स्कूल के दिनों में यहीं बैठते थे?'], [1, 'हाँ, तब चाय पाँच रुपये की थी'], [0, 'और समोसे के साथ चटनी मुफ़्त मिलती थी'], [1, 'वो दिन भी क्या दिन थे']] },
    { g: 'mm', lines: [[0, 'सुबह की सैर शुरू की है मैंने'], [1, 'तू? कितने दिन चलेगी ये सैर?'], [0, 'इस बार पक्का, पूरे सात दिन हो गए'], [1, 'सात दिन? अब तो चाय भी पीने दे']] },
    { g: 'mm', lines: [[0, 'शर्मा जी का नया घर देखा?'], [1, 'हाँ, पूरा पेंट कराया है, चमक रहा है'], [0, 'सुना है गृह प्रवेश है इतवार को'], [1, 'तो मिठाई पक्की']] },
    { g: 'ff', lines: [[0, 'तूने वो सूट लिया जो कल दिखाया था?'], [1, 'हाँ, पर रंग थोड़ा अलग निकला'], [0, 'तो वापस कर दे ना'], [1, 'देखती हूँ, पहले चाय तो पी लूँ']] },
    { g: 'ff', lines: [[0, 'आज ऑफिस से जल्दी निकल गई मैं'], [1, 'अच्छा किया, रोज़ देर तक बैठती है'], [0, 'बस, थोड़ी चाय और गपशप का मन था'], [1, 'सही है! यहाँ की चाय तो कमाल है']] },
    { g: 'ff', lines: [[0, 'बेटी का एडमिशन हो गया आख़िर'], [1, 'अरे वाह, बधाई हो!'], [0, 'बस अब फ़ीस की चिंता है'], [1, 'सब हो जाएगा, तू टेंशन मत ले']] },
    { g: 'mf', lines: [[0, 'सुनो, कल की मीटिंग का क्या हुआ?'], [1, 'टल गई है, अब शुक्रवार को होगी'], [0, 'चलो अच्छा हुआ, आज चैन से चाय पीते हैं'], [1, 'हाँ, आज काम की कोई बात नहीं']] }
  ];
  // customer at a table calls out; owner answers (spoken, short, contextual)
  const orders = [
    [[0, 'भैया, दो चाय देना'], [1, 'अभी लाया']], [[0, 'एक कटिंग चाय'], [1, 'आ रही है']], [[0, 'भैया, अदरक वाली चाय'], [1, 'बस दो मिनट']]
  ];
  // counter transactions (buyer = speaker 0, owner = speaker 1). `item` decides what the owner physically does.
  const buys = {
    chips: [[0, 'भैया, एक कुरकुरे देना'], [1, 'मसाला या चीज़?'], [0, 'मसाला'], [1, 'ये लो, दस रुपये']],
    biscuit: [[0, 'पारले-जी है क्या?'], [1, 'है, अभी निकालता हूँ'], [1, 'ये लो, पाँच रुपये']],
    cola: [[0, 'एक ठंडा चाहिए'], [1, 'कौन सा, कोला?'], [0, 'हाँ, एकदम ठंडा वाला'], [1, 'लो, बीस रुपये']],
    samosa: [[0, 'दो समोसे, गरमा-गरम'], [1, 'अभी निकले हैं, चटनी लगा दूँ?'], [0, 'हाँ, खूब सारी'], [1, 'ये लो, तीस रुपये']],
    parcel: [[0, 'भैया, दो चाय पार्सल'], [1, 'अभी बनाता हूँ, दो मिनट रुको'], [0, 'ठीक है, ज़रा जल्दी करना']]
  };
  const pay = { upi: [[0, 'यू-पी-आई कर दूँ?'], [1, 'हाँ, यहाँ स्कैन कर लो']], cash: [[0, 'ये लो पैसे'], [1, 'छुट्टे हैं ना?']] };
  const sound = { upi: 'पेटीएम पर दस रुपये प्राप्त हुए' }; // payment speaker (spoken by the soundbox)
  const calls = [['हाँ भाई, बोल'], ['अच्छा, ठीक है'], ['मैं टपरी पर हूँ, आधे घंटे में पहुँचता हूँ'], ['चल, रखता हूँ']];
  const thanks = ['शुक्रिया भैया', 'धन्यवाद', 'वाह, गरम है']; const serve = ['लीजिए, गरम चाय', 'ये लीजिए']; const owner = ['समोसे अभी निकले हैं, गरमा-गरम!'];
  // street life (street.js). Voice keys: k = begging child / kid (Munni), k2 = second kid (Amit), v1..v5 = vendors (Vikas, Keshav, Samar, Abhishek, Vihan).
  // These clips were made with the ElevenLabs MCP (eleven_v4) and fetched by tools/fetch_street_voices.mjs.
  const street = {
    vendors: { sabzi: 'सब्ज़ी ले लो! टमाटर, आलू, प्याज़… ताज़ा सब्ज़ी!', chana: 'गरम चने! चना जोर गरम!', gubbare: 'गुब्बारे ले लो! रंग-बिरंगे गुब्बारे!', kulfi: 'कुल्फ़ी! मलाई कुल्फ़ी! ठंडी-ठंडी कुल्फ़ी!', raddi: 'रद्दी वाला! पुराना अख़बार, रद्दी बेच लो!' },
    vendorVoice: { sabzi: 'v1', chana: 'v2', gubbare: 'v3', kulfi: 'v4', raddi: 'v5' },
    beg: { askF: 'दीदी, कुछ दे दो ना… सुबह से कुछ नहीं खाया', askM: 'भैया, दस रुपये दे दो, भगवान भला करेगा', thanks: 'थैंक यू! भगवान आपका भला करे!', giveM: 'ये लो बेटा, कुछ खा लेना', noM: 'माफ़ करना बेटा, छुट्टे नहीं हैं', giveF: 'ये ले, और जाकर कुछ खा ले', noF: 'अभी नहीं बेटा, जाओ' },
    kids: ['भाग, जल्दी भाग! रन ले!', 'आउट! आउट है!', 'नहीं, नॉट आउट! बॉल नीचे थी!']
  };
  const shoo = ['हट! हट!', 'अरे हट यहाँ से!', 'ए, भाग यहाँ से!'], pee = ['अरे यार, ये कुत्ता…', 'छी! यहीं कर दिया!'];
  (window.TAPRI_STORIES || []).forEach(st => chats.push({ g: st.g, id: st.id, title: st.title, long: true, lines: st.lines }));
  const V = { mm: ['m', 'm2'], ff: ['f', 'f2'], mf: ['m', 'f'] };
  function all() { const o = []; const add = (v, t) => o.push({ v, text: t });
    chats.forEach(c => c.lines.forEach(([s, t]) => add(V[c.g][s], t)));
    orders.forEach(p => { add('m', p[0][1]); add('o', p[1][1]); }); orders.forEach(p => add('f', p[0][1]));
    for (const k in buys) buys[k].forEach(([s, t]) => { add(s ? 'o' : 'm', t); if (!s) add('f', t); });
    for (const k in pay) pay[k].forEach(([s, t]) => { add(s ? 'o' : 'm', t); });
    add('o', sound.upi); calls.forEach(([t]) => { add('m', t); add('f', t); }); thanks.forEach(t => { add('m', t); add('f', t); }); serve.forEach(t => add('h', t)); shoo.concat(pee).forEach(t => { add('m', t); add('f', t); }); owner.forEach(t => add('o', t));
    for (const k in street.vendors) add(street.vendorVoice[k], street.vendors[k]); const b = street.beg; add('k', b.askF); add('k', b.askM); add('k', b.thanks); add('m', b.giveM); add('m', b.noM); add('f', b.giveF); add('f', b.noF); add('k2', street.kids[0]); add('k2', street.kids[1]); add('k', street.kids[2]);
    const seen = new Set(); return o.filter(x => { const k = x.v + '|' + x.text; if (seen.has(k)) return false; seen.add(k); return true; }); }
  window.TAPRI_DIALOGUES = { street, shoo, pee, chats, orders, buys, pay, sound, calls, thanks, serve, owner, voiceFor: (g, s) => V[g][s], ALL_LINES: all };
})();
