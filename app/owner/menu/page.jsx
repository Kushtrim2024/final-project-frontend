import { useEffect, useState } from "react";

export default function OwnerMenuPage() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetch("/api/owner/menu", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => setMenuItems(data));
  }, []);

  return (
    <div>
      <h1>Mein Menü</h1>
      <ul>
        {menuItems.map((item) => (
          <li key={item._id}>
            {item.name} - {item.price} €
          </li>
        ))}
      </ul>
    </div>
  );
}
