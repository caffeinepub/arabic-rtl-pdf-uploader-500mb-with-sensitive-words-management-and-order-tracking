import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // File storage
  include MixinStorage();

  // Type definitions
  public type SchroedingkOrder = {
    orderNumber : Text;
    bookTitle : Text;
    transferEntity : Text;
    transferDate : Text;
    reminderDate : Text;
    notes : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  public type SensitiveFile = {
    id : Nat;
    file : Storage.ExternalBlob;
    filename : Text;
    uploadedBy : Principal;
  };

  // Stores
  let orders = Map.empty<Nat, SchroedingkOrder>();
  let sensitiveWords = Map.empty<Nat, Text>();
  let sensitiveFiles = Map.empty<Nat, SensitiveFile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextWordId : Nat = 0;
  var nextFileId : Nat = 0;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Orders CRUD
  public shared ({ caller }) func createOrder(order : SchroedingkOrder) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    let id = orders.size();
    orders.add(id, order);
    id;
  };

  public query ({ caller }) func getOrder(id : Nat) : async SchroedingkOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    switch (orders.get(id)) {
      case (null) {
        Runtime.trap("Order not found (ID " # id.toText() # ")");
      };
      case (?order) { order };
    };
  };

  public query ({ caller }) func getAllOrders() : async [SchroedingkOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrder(id : Nat, order : SchroedingkOrder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update orders");
    };
    if (not orders.containsKey(id)) {
      Runtime.trap("Order not found (ID " # id.toText() # ")");
    };
    orders.add(id, order);
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete orders");
    };
    orders.remove(id);
  };

  // Sensitive Files
  public shared ({ caller }) func uploadSensitiveFile(blob : Storage.ExternalBlob, filename : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };

    let id = nextFileId;
    let file = {
      id;
      file = blob;
      filename;
      uploadedBy = caller;
    };

    sensitiveFiles.add(id, file);
    nextFileId += 1;
    id;
  };

  public query ({ caller }) func getAllSensitiveFiles() : async [(Nat, SensitiveFile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sensitive files");
    };
    sensitiveFiles.entries().toArray();
  };

  // Sensitive Words
  public shared ({ caller }) func saveSensitiveWord(word : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save words");
    };
    let id = nextWordId;
    sensitiveWords.add(id, word);
    nextWordId += 1;
    id;
  };

  public query ({ caller }) func getAllSensitiveWords() : async [(Nat, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sensitive words");
    };
    sensitiveWords.entries().toArray();
  };

  public shared ({ caller }) func updateSensitiveWord(id : Nat, word : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update words");
    };
    if (not sensitiveWords.containsKey(id)) {
      Runtime.trap("Sensitive word not found (ID " # id.toText() # ")");
    };
    sensitiveWords.add(id, word);
  };

  public shared ({ caller }) func removeSensitiveWord(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove words");
    };
    sensitiveWords.remove(id);
  };
};
