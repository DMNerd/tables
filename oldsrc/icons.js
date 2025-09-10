import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faPlus,
  faColumns,
  faMinus,
  faTrashAlt,
  faRotateRight,
  faFileAlt,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

// Add only the icons used in your HTML
library.add(
  faPlus,
  faColumns,
  faMinus,
  faTrashAlt,
  faRotateRight,
  faFileAlt,
  faUpload,
);

// Automatically replace <i> tags with SVGs
dom.watch();
