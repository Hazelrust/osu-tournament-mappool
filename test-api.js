async function test() {
  const beatmapId = '1708088'; // from the CSV
  
  // 1. Get token
  const resToken = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: "58608",
      client_secret: "It3DDwUOErGKJUIkekkXDxCZCcqiLyLBqItBuwzl",
      grant_type: 'client_credentials',
      scope: 'public'
    })
  });
  const tokenData = await resToken.json();
  const token = tokenData.access_token;
  
  // 2. Test attributes with string array
  const resAttr1 = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/attributes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mods: ["HR"], ruleset: 'osu' })
  });
  console.log('Test 1 (["HR"]):', await resAttr1.json());
  
  // 3. Test attributes with object array
  const resAttr2 = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/attributes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mods: [{acronym: "HR"}], ruleset: 'osu' })
  });
  console.log('Test 2 ([{acronym: "HR"}]):', await resAttr2.json());
  
  // 4. Test attributes with integer (HR = 16)
  const resAttr3 = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/attributes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mods: 16, ruleset: 'osu' })
  });
  console.log('Test 3 (mods: 16):', await resAttr3.json());
}

test();
