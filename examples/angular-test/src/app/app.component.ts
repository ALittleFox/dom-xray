import { Component } from "@angular/core";
import { CardComponent } from "./components/card/card.component";
import { InlineDemoComponent } from "./components/inline-demo/inline-demo.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  imports: [CardComponent, InlineDemoComponent],
})
export class AppComponent {
  title = "Angular + DOM Selector";
}
