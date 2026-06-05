import { Component } from "@angular/core";

@Component({
  selector: "app-inline-demo",
  template: `
    <div class="inline-demo">
      <h3>Inline Template Demo</h3>
      <p>This component uses an inline template with data-source injection.</p>
      <button class="btn" (click)="onClick()">Click me</button>
    </div>
  `,
  styles: [
    `
      .inline-demo {
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-top: 16px;
      }
      .btn {
        padding: 8px 16px;
        background: #1890ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class InlineDemoComponent {
  onClick() {
    console.log("Inline demo button clicked");
  }
}
