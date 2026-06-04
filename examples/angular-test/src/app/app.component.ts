import { Component } from "@angular/core";
import { CardComponent } from "./components/card/card.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  imports: [CardComponent],
})
export class AppComponent {
  title = "Angular + DOM Selector";
}
