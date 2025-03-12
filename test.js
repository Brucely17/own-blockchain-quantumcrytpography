
async () => {
    const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "farmer" })
    });
    console.log(await response.json());
    });

