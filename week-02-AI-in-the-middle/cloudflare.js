export default {
  async fetch(request, env) {

    try {

      if (request.method === "GET") {
        return new Response("OK");
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      const habit = body.habit;

      let value = body.value;
      if (value === undefined) value = true;
      if (value === "true") value = true;
      if (value === "false") value = false;

      if (!habit) {
        return new Response("Missing habit", { status: 400 });
      }

      const today = new Date().toISOString().split("T")[0];

      const habitMap = {
        workout: "Evening: 1 hour workout",
        yoga: "Morning: 1 hour yoga",
        water: "Water: 2 liters"
      };

      // ---------- STATUS MODE ----------
      if (habit === "habt") {

        const res = await fetch(
          `https://api.notion.com/v1/databases/${env.NOTION_DB_ID}/query`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.NOTION_API_KEY}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              sorts: [{ property: "Date", direction: "descending" }],
              page_size: 7
            })
          }
        );

        const txt = await res.text();
        if (!res.ok) return new Response("Query failed");

        const data = JSON.parse(txt);

        if (data.results.length === 0) {
          return new Response("No data for today");
        }

        const pages = data.results;

        const days = pages.map(page => {
          const p = page.properties;
          return {
            id: page.id,
            workout: p["Evening: 1 hour workout"].checkbox,
            yoga: p["Morning: 1 hour yoga"].checkbox,
            water: p["Water: 2 liters"].checkbox
          };
        });

        // ---------- STREAK ----------
        let streak = 0;
        for (let d of days) {
          if (d.workout && d.yoga && d.water) {
            streak++;
          } else {
            break;
          }
        }

        // ---------- RESET CHECK (last 3 days failed) ----------
        let reset = false;

        if (days.length >= 3) {
          const last3 = days.slice(0, 3);

          const allFailed = last3.every(d =>
            !(d.workout && d.yoga && d.water)
          );

          if (allFailed) reset = true;
        }

        // ---------- RESET ACTION ----------
        if (reset) {

          // Archive all pages
          for (let d of days) {
            await fetch(`https://api.notion.com/v1/pages/${d.id}`, {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${env.NOTION_API_KEY}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                archived: true
              })
            });
          }

          // Create fresh page
          await fetch(`https://api.notion.com/v1/pages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.NOTION_API_KEY}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              parent: { database_id: env.NOTION_DB_ID },
              properties: {
                "Day": {
                  title: [{ text: { content: "Restart Day" } }]
                },
                "Date": {
                  date: { start: today }
                }
              }
            })
          });

          return new Response("Reset triggered. Fresh start today.");
        }

        const todayData = days[0];

        const fallbackText = `Today workout ${todayData.workout ? "done" : "missed"}, water ${todayData.water ? "done" : "missed"}, yoga ${todayData.yoga ? "done" : "missed"}. Streak ${streak}.`;

        // ---------- PROMPT ----------
        const isPoor = streak < 2;

        const template = isPoor
          ? env.AI_PROMPT_STRICT
          : env.AI_PROMPT_GOOD;

        const prompt = template
          .replace("{{workout}}", todayData.workout)
          .replace("{{yoga}}", todayData.yoga)
          .replace("{{water}}", todayData.water)
          .replace("{{streak}}", streak);

        // ---------- GEMINI ----------
        async function callGemini(model) {
          return fetch(
            `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          );
        }

        let aiRes;

        try {
          aiRes = await callGemini("models/gemini-2.5-flash");

          if (aiRes.status === 429) {
            aiRes = await callGemini("models/gemini-2.0-flash-lite-001");
          }

          const aiTxt = await aiRes.text();

          if (!aiRes.ok) return new Response(fallbackText);

          const aiData = JSON.parse(aiTxt);

          const aiText =
            aiData.candidates?.[0]?.content?.parts?.[0]?.text;

          return new Response(aiText || fallbackText);

        } catch {
          return new Response(fallbackText);
        }
      }

      // ---------- UPDATE MODE ----------
      const propertyName = habitMap[habit];

      const queryRes = await fetch(
        `https://api.notion.com/v1/databases/${env.NOTION_DB_ID}/query`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filter: {
              property: "Date",
              date: { equals: today }
            }
          })
        }
      );

      const queryData = await queryRes.json();

      let pageId;

      if (queryData.results.length === 0) {

        await fetch(`https://api.notion.com/v1/pages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parent: { database_id: env.NOTION_DB_ID },
            properties: {
              "Day": {
                title: [{ text: { content: "Today" } }]
              },
              "Date": {
                date: { start: today }
              },
              [propertyName]: { checkbox: value }
            }
          })
        });

        return new Response(`${habit} logged`);
      }

      pageId = queryData.results[0].id;

      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${env.NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            [propertyName]: { checkbox: value }
          }
        })
      });

      return new Response(`${habit} updated`);

    } catch (err) {
      return new Response("Worker crash: " + err.message);
    }
  }
};